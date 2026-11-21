from __future__ import annotations

import logging
from datetime import UTC, datetime

from fastapi import APIRouter, Response
from sqlalchemy import func, select, text

from app import __version__
from app.core.config import get_settings
from app.db.models import DocumentChunk
from app.db.session import DatabaseNotConfigured, get_session_factory

logger = logging.getLogger(__name__)
router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict[str, str]:
    """Liveness: the process is up. Does not touch the database (use this for restarts)."""
    return {
        "status": "ok",
        "version": __version__,
        "time": datetime.now(UTC).isoformat(timespec="seconds"),
    }


@router.get("/health/ready")
async def ready(response: Response) -> dict[str, object]:
    """Readiness: the database answers, pgvector is installed and the knowledge base has passages."""
    settings = get_settings()
    checks: dict[str, object] = {
        "llm_provider": settings.llm_provider,
        "llm_model": settings.resolved_llm_model,
        "embedding_provider": settings.embedding_provider,
        "database": "unknown",
        "pgvector": "unknown",
        "knowledge_chunks": None,
    }
    try:
        async with get_session_factory()() as session:
            await session.execute(text("SELECT 1"))
            checks["database"] = "ok"
            extension = await session.scalar(
                text("SELECT extversion FROM pg_extension WHERE extname='vector'")
            )
            checks["pgvector"] = extension or "missing"
            if extension:
                checks["knowledge_chunks"] = await session.scalar(select(func.count(DocumentChunk.id)))
    except DatabaseNotConfigured:
        checks["database"] = "not_configured"
    except Exception:
        logger.exception("readiness check failed")
        checks["database"] = "unreachable"

    ok = checks["database"] == "ok" and checks["pgvector"] not in {"missing", "unknown"}
    checks["status"] = "ready" if ok else "not_ready"
    if not ok:
        response.status_code = 503
    return checks
