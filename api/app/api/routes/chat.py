from __future__ import annotations

import contextlib
import json
import logging
import re
from collections.abc import AsyncIterator
from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field, field_validator

from app.core.config import Settings, get_settings
from app.core.security import (
    client_ip,
    enforce_chat_rate_limit,
    enforce_session_rate_limit,
    hash_ip,
    verify_client,
)
from app.db.session import DatabaseNotConfigured, get_session_factory
from app.services import guard, rag
from app.services.llm import ChatMessage, LLMError, get_condense_llm, get_embedder, get_llm

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])

_SESSION_ID = re.compile(r"^[A-Za-z0-9_-]{8,64}$")
MAX_MESSAGE_CHARS = 500


class HistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=4000)


class ChatRequest(BaseModel):
    session_id: str = Field(
        description="Random id the browser keeps for this conversation (8-64 letters, digits, - or _)."
    )
    message: str = Field(
        min_length=1,
        max_length=MAX_MESSAGE_CHARS,
        description=f"The visitor's question (at most {MAX_MESSAGE_CHARS} characters).",
    )
    history: list[HistoryItem] = Field(
        default_factory=list, max_length=40, description="Earlier turns, oldest first."
    )
    stream: bool = Field(default=True, description="true: Server-Sent Events. false: one JSON reply.")

    @field_validator("session_id")
    @classmethod
    def _valid_session_id(cls, value: str) -> str:
        if not _SESSION_ID.match(value):
            raise ValueError("session_id must be 8-64 characters: letters, digits, - or _")
        return value

    @field_validator("message")
    @classmethod
    def _strip_message(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("message must not be empty")
        return value


class Reference(BaseModel):
    source: str
    heading: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]
    references: list[Reference]
    grounded: bool
    suggestions: list[str] = Field(default_factory=list, description="2-3 questions to ask next.")


def _sse(event: str, data: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


async def _events(request: ChatRequest, ip_hash: str, settings: Settings) -> AsyncIterator[rag.ChatEvent]:
    """Build the services and run one turn. Setup problems become error events, not 500s."""
    verdict = guard.screen(settings, request.message)
    if verdict.verdict != "ok":
        # Answered with a fixed reply: no retrieval, no model call, nothing for an attacker to steer.
        logger.warning("message blocked", extra={"reason": verdict.verdict, "ip": ip_hash[:12]})
        with contextlib.suppress(DatabaseNotConfigured):
            await rag.save_chat_log(
                get_session_factory(),
                session_id=request.session_id,
                question=request.message,
                answer=verdict.reply,
                ip_hash=ip_hash,
            )
        asked = [h.content for h in request.history if h.role == "user"] + [request.message]
        yield rag.ChatEvent("sources", {"sources": [], "references": []})
        yield rag.ChatEvent("token", {"text": verdict.reply})
        yield rag.ChatEvent(
            "done",
            {
                "sources": [],
                "references": [],
                "grounded": False,
                "suggestions": guard.suggest_followups(settings, sources=[], asked=asked),
            },
        )
        return

    try:
        llm = get_llm()
        condense_llm = get_condense_llm()
        embedder = get_embedder()
        session_factory = get_session_factory()
    except (LLMError, DatabaseNotConfigured) as exc:
        code = rag.public_code(exc.code) if isinstance(exc, LLMError) else "unavailable"
        logger.error("chat is not configured", extra={"reason": str(exc)})
        yield rag.ChatEvent("error", {"code": code, "message": "The assistant is not available right now."})
        return

    async for event in rag.stream_answer(
        question=request.message,
        history=[ChatMessage(h.role, h.content) for h in request.history],
        session_id=request.session_id,
        ip_hash=ip_hash,
        session_factory=session_factory,
        settings=settings,
        llm=llm,
        embedder=embedder,
        condense_llm=condense_llm,
    ):
        yield event


@router.post(
    "/chat",
    response_model=ChatResponse,
    responses={
        200: {
            "description": "With `stream: true` (the default) the reply is `text/event-stream`: "
            "events `sources`, then many `token` events, then `done` (sources, grounded and 2-3 "
            "`suggestions`) or `error`.",
            "content": {"text/event-stream": {}},
        },
        403: {"description": "Origin or API key not accepted."},
        429: {"description": "Too many messages from one IP or one session."},
    },
    dependencies=[Depends(verify_client), Depends(enforce_chat_rate_limit)],
)
async def chat(request: Request, body: ChatRequest, settings: Annotated[Settings, Depends(get_settings)]):
    """Ask the assistant a question about the site owner (answers come from the knowledge base)."""
    enforce_session_rate_limit(body.session_id)
    ip_hash = hash_ip(client_ip(request))
    events = _events(body, ip_hash, settings)

    if body.stream:

        async def generate() -> AsyncIterator[str]:
            async for event in events:
                yield _sse(event.type, event.data)

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"},
        )

    # Not streaming: collect the whole answer into one JSON reply.
    parts: list[str] = []
    sources: list[str] = []
    refs: list[dict[str, str]] = []
    grounded = False
    suggestions: list[str] = []
    async for event in events:
        if event.type == "token":
            parts.append(event.data["text"])
        elif event.type == "sources":
            sources = event.data["sources"]
            refs = event.data["references"]
        elif event.type == "done":
            grounded = bool(event.data.get("grounded"))
            suggestions = event.data.get("suggestions", [])
        elif event.type == "error":
            return JSONResponse(
                status_code=503, content={"detail": event.data["message"], "code": event.data["code"]}
            )
    return ChatResponse(
        answer="".join(parts).strip(),
        sources=sources,
        references=[Reference(**r) for r in refs],
        grounded=grounded,
        suggestions=suggestions,
    )
