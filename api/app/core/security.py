"""Small security helpers: client IP, IP hashing and a per-IP rate limiter."""

from __future__ import annotations

import hashlib
import hmac
import time
from collections import deque
from functools import lru_cache

from fastapi import HTTPException, Request

from app.core.config import get_settings


def client_ip(request: Request) -> str:
    """The caller's IP. X-Forwarded-For is only believed when TRUST_PROXY_HEADERS is on."""
    if get_settings().trust_proxy_headers:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            first = forwarded.split(",")[0].strip()
            if first:
                return first
    return request.client.host if request.client else "unknown"


def hash_ip(ip: str) -> str:
    """Keyed hash of an IP, so abuse can be spotted without storing the address itself."""
    salt = get_settings().ip_hash_salt.get_secret_value().encode()
    return hmac.new(salt, ip.encode(), hashlib.sha256).hexdigest()


class SlidingWindowLimiter:
    """At most `limit` hits per `window_seconds` for each key. In memory, per process."""

    def __init__(self, limit: int, window_seconds: float, max_keys: int = 10_000) -> None:
        self.limit = limit
        self.window = window_seconds
        self.max_keys = max_keys
        self._hits: dict[str, deque[float]] = {}

    def check(self, key: str, now: float | None = None) -> tuple[bool, int]:
        """Record a hit. Returns (allowed, seconds_until_allowed)."""
        now = time.monotonic() if now is None else now
        if len(self._hits) > self.max_keys:  # keep memory bounded
            for stale in [k for k, q in self._hits.items() if not q or q[-1] <= now - self.window]:
                del self._hits[stale]

        hits = self._hits.setdefault(key, deque())
        while hits and hits[0] <= now - self.window:
            hits.popleft()
        if len(hits) >= self.limit:
            return False, max(1, int(hits[0] + self.window - now) + 1)
        hits.append(now)
        return True, 0


@lru_cache
def get_chat_limiter() -> SlidingWindowLimiter:
    return SlidingWindowLimiter(get_settings().chat_rate_limit_per_minute, 60)


def enforce_chat_rate_limit(request: Request) -> None:
    """FastAPI dependency: 429 with Retry-After when one IP sends too many messages."""
    allowed, retry_after = get_chat_limiter().check(client_ip(request))
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Too many messages. Please wait a moment and try again.",
            headers={"Retry-After": str(retry_after)},
        )
