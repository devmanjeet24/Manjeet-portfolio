"""Async database engine and sessions (SQLAlchemy 2 + asyncpg), tuned for Neon."""

from __future__ import annotations

from collections.abc import AsyncIterator
from functools import lru_cache
from typing import Any

from sqlalchemy.engine import URL, make_url
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings


class DatabaseNotConfigured(RuntimeError):
    """DATABASE_URL is empty."""


def build_engine_args(raw_url: str) -> tuple[URL, dict[str, Any]]:
    """Turn a normal Postgres URL (such as the one Neon shows) into asyncpg settings.

    - `postgres://` and `postgresql://` become `postgresql+asyncpg://`.
    - asyncpg does not understand libpq's `sslmode` or `channel_binding`; they become `ssl`.
    - Neon's pooled hosts (`-pooler`) sit behind PgBouncer, which needs prepared statements off.
    """
    if not raw_url.strip():
        raise DatabaseNotConfigured("DATABASE_URL is not set")

    url = make_url(raw_url.strip())
    query = dict(url.query)
    sslmode = str(query.pop("sslmode", "") or "")
    query.pop("channel_binding", None)

    connect_args: dict[str, Any] = {}
    if sslmode in {"require", "verify-ca", "verify-full"}:
        connect_args["ssl"] = "require" if sslmode == "require" else True
    if url.host and "-pooler" in url.host:
        connect_args["statement_cache_size"] = 0
        query["prepared_statement_cache_size"] = "0"

    url = url.set(drivername="postgresql+asyncpg", query=query)
    return url, connect_args


@lru_cache
def get_engine() -> AsyncEngine:
    """Created on first use, so the app (and /docs) starts even before a database exists."""
    url, connect_args = build_engine_args(get_settings().database_url)
    return create_async_engine(
        url,
        connect_args=connect_args,
        pool_size=5,
        max_overflow=5,
        pool_pre_ping=True,  # Neon pauses idle databases: drop dead connections quietly
        pool_recycle=300,
    )


@lru_cache
def get_session_factory() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(get_engine(), expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency: one session per request."""
    async with get_session_factory()() as session:
        yield session


async def dispose_engine() -> None:
    """Close the connection pool (on shutdown). Does nothing if it was never opened."""
    if get_engine.cache_info().currsize:
        await get_engine().dispose()
