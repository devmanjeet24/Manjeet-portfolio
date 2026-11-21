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
    """Per-IP limit (the hashed IP is the key, so the address is never held)."""
    settings = get_settings()
    return SlidingWindowLimiter(settings.chat_rate_limit_ip, settings.chat_rate_window_seconds)


@lru_cache
def get_session_limiter() -> SlidingWindowLimiter:
    settings = get_settings()
    return SlidingWindowLimiter(settings.chat_rate_limit_session, settings.chat_rate_window_seconds)


def _too_many(retry_after: int) -> HTTPException:
    return HTTPException(
        status_code=429,
        detail="Too many messages. Please wait a few minutes and try again.",
        headers={"Retry-After": str(retry_after)},
    )


def verify_client(request: Request) -> None:
    """Only the portfolio site should call the chat API.

    - If a browser sends an `Origin`, it must be one of ALLOWED_ORIGINS (CORS alone only stops the
      browser from *reading* a reply; this stops the request from being served at all).
    - If CHAT_API_KEY is set, `X-API-Key` must match it.

    Both can be faked by a script that sets the headers, so they are a filter, not a lock: the
    rate limits and prompt rules are what really protect the service.
    """
    settings = get_settings()
    origin = request.headers.get("origin")
    if origin is not None and origin.rstrip("/") not in settings.allowed_origins_list:
        raise HTTPException(status_code=403, detail="This site is not allowed to use the assistant.")
    if settings.chat_api_key is not None:
        sent = request.headers.get("x-api-key", "")
        if not hmac.compare_digest(sent.encode(), settings.chat_api_key.get_secret_value().encode()):
            raise HTTPException(status_code=403, detail="Missing or invalid API key.")


def enforce_chat_rate_limit(request: Request) -> None:
    """FastAPI dependency: 429 with Retry-After when one IP sends too many messages."""
    allowed, retry_after = get_chat_limiter().check(hash_ip(client_ip(request)))
    if not allowed:
        raise _too_many(retry_after)


def enforce_session_rate_limit(session_id: str) -> None:
    """429 when one conversation id sends too many messages (stops id-hopping from one browser
    being cheaper than the IP limit, and one id being shared by many IPs)."""
    allowed, retry_after = get_session_limiter().check(session_id)
    if not allowed:
        raise _too_many(retry_after)
