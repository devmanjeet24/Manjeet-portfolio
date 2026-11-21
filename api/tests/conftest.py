import pytest

from app.core.config import get_settings
from app.core.security import get_chat_limiter


@pytest.fixture(autouse=True)
def clean_settings(monkeypatch):
    """Every test starts from defaults, whatever is in the developer's environment or .env."""
    for name in list(__import__("os").environ):
        if name.split("_")[0] in {
            "LLM",
            "EMBEDDING",
            "DATABASE",
            "ALLOWED",
            "TRUST",
            "CHAT",
            "RAG",
            "IP",
            "APP",
            "LOG",
            "ENABLE",
            "OWNER",
            "ANTHROPIC",
        }:
            monkeypatch.delenv(name, raising=False)
    monkeypatch.chdir(__import__("tempfile").mkdtemp())  # so no stray .env is read
    get_settings.cache_clear()
    get_chat_limiter.cache_clear()
    yield
    get_settings.cache_clear()
    get_chat_limiter.cache_clear()
