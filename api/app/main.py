"""FastAPI application: chat API for the portfolio assistant."""

from __future__ import annotations

import logging
import time
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app import __version__
from app.api.routes import chat, health
from app.core.config import get_settings
from app.core.logging import configure_logging, request_id_var
from app.db.session import dispose_engine

logger = logging.getLogger("app")


class RequestContextMiddleware:
    """Gives every request an id (X-Request-ID), and logs one line per request."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        incoming = dict(scope["headers"]).get(b"x-request-id", b"").decode()[:64]
        request_id = incoming if incoming.replace("-", "").isalnum() else uuid.uuid4().hex[:16]
        token = request_id_var.set(request_id or uuid.uuid4().hex[:16])
        started = time.perf_counter()
        status = 500

        async def send_wrapper(message: Message) -> None:
            nonlocal status
            if message["type"] == "http.response.start":
                status = message["status"]
                message.setdefault("headers", []).append((b"x-request-id", request_id_var.get().encode()))
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            logger.info(
                "request",
                extra={
                    "method": scope["method"],
                    "path": scope["path"],
                    "status": status,
                    "duration_ms": round((time.perf_counter() - started) * 1000, 1),
                },
            )
            request_id_var.reset(token)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    configure_logging(settings.log_level, json_logs=settings.json_logs)
    logger.info(
        "starting",
        extra={
            "version": __version__,
            "env": settings.app_env,
            "llm_provider": settings.llm_provider,
            "llm_model": settings.resolved_llm_model,
            "embedding_provider": settings.embedding_provider,
            "embedding_dim": settings.embedding_dim,
            "database_configured": bool(settings.database_url),
            "allowed_origins": settings.allowed_origins_list,
        },
    )
    if settings.is_production and settings.ip_hash_salt.get_secret_value() == "change-me":
        logger.warning("IP_HASH_SALT is still the default: set your own secret value")
    if not settings.allowed_origins_list:
        logger.warning("ALLOWED_ORIGINS is empty: no website can call this API from a browser")
    if settings.embedding_provider == "hash":
        logger.warning("EMBEDDING_PROVIDER=hash is for development only (it understands no meaning)")
    yield
    await dispose_engine()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Portfolio assistant API",
        version=__version__,
        description="Backend for the chat assistant on the portfolio site: retrieval-augmented answers "
        "over a small knowledge base. The rest of the portfolio does not need this service.",
        lifespan=lifespan,
        docs_url="/docs" if settings.enable_docs else None,
        redoc_url=None,
        openapi_url="/openapi.json" if settings.enable_docs else None,
    )

    # Only the sites listed in ALLOWED_ORIGINS may call the API from a browser.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "X-Request-ID"],
        expose_headers=["X-Request-ID", "Retry-After"],
        max_age=600,
    )
    app.add_middleware(RequestContextMiddleware)

    @app.exception_handler(Exception)
    async def unhandled(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("unhandled error")
        return JSONResponse(status_code=500, content={"detail": "Something went wrong."})

    app.include_router(health.router)
    app.include_router(chat.router)

    @app.get("/", include_in_schema=False)
    async def root() -> dict[str, str]:
        return {"service": "portfolio-assistant", "docs": "/docs" if settings.enable_docs else "disabled"}

    return app


app = create_app()
