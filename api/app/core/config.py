"""Application settings, read from environment variables (and a local `.env` file)."""

from __future__ import annotations

from functools import lru_cache
from typing import Any, Literal

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

LLMProviderName = Literal["anthropic", "openai", "groq", "gemini", "mock"]
EmbeddingProviderName = Literal["openai", "gemini", "hash"]
Effort = Literal["low", "medium", "high", "xhigh", "max"]

# Used when LLM_MODEL is not set. Model names change often: check your provider's docs.
DEFAULT_LLM_MODELS: dict[str, str] = {
    "anthropic": "claude-opus-5-5",
    "openai": "gpt-4o-mini",
    "groq": "llama-3.3-70b-versatile",
    "gemini": "gemini-2.0-flash",
    "mock": "mock-1",
}

# OpenAI, Groq and Gemini all speak the OpenAI chat/embeddings protocol.
OPENAI_COMPAT_BASE_URLS: dict[str, str | None] = {
    "openai": None,  # the SDK's default
    "groq": "https://api.groq.com/openai/v1",
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai/",
}

_OPTIONAL_FIELDS = (
    "llm_api_key",
    "llm_model",
    "llm_base_url",
    "llm_effort",
    "llm_temperature",
    "embedding_api_key",
    "embedding_base_url",
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", case_sensitive=False
    )

    # ---- App ----
    app_env: Literal["development", "production", "test"] = "development"
    log_level: str = "INFO"
    #: JSON log lines. Unset = JSON in production, readable text otherwise.
    log_json: bool | None = None
    enable_docs: bool = True
    owner_name: str = "Manjeet Singh"

    # ---- Database (Neon PostgreSQL) ----
    database_url: str = ""

    # ---- LLM ----
    llm_provider: LLMProviderName = "anthropic"
    llm_api_key: SecretStr | None = None
    llm_model: str | None = None
    #: Override the API address (a proxy, or any other OpenAI-compatible service).
    llm_base_url: str | None = None
    llm_max_tokens: int = 700
    #: Anthropic only: how much the model thinks. `low` is right for short grounded answers.
    #: Leave empty for Claude models that do not support `effort`.
    llm_effort: Effort | None = "low"
    #: OpenAI-compatible providers only. Unset = the provider's default (some models reject it).
    llm_temperature: float | None = None
    #: Anthropic only: re-run a request on a fallback model if the first one declines it.
    anthropic_refusal_fallback: bool = True

    # ---- Embeddings ----
    embedding_provider: EmbeddingProviderName = "openai"
    embedding_model: str = "text-embedding-3-small"
    #: Must equal the vector column's size (set when the migration runs).
    embedding_dim: int = 1536
    #: Needed when the embedding provider differs from the LLM provider (Anthropic has no embeddings).
    embedding_api_key: SecretStr | None = None
    embedding_base_url: str | None = None

    # ---- HTTP ----
    #: Comma-separated list of site addresses allowed to call the API from a browser.
    allowed_origins: str = ""
    #: Trust X-Forwarded-For (turn on behind Render/Vercel/nginx, off when exposed directly).
    trust_proxy_headers: bool = False
    chat_rate_limit_per_minute: int = 10
    chat_max_message_chars: int = 1000
    chat_history_turns: int = 6
    #: Secret for hashing visitor IPs before they are stored. Change it in production.
    ip_hash_salt: SecretStr = SecretStr("change-me")

    # ---- RAG ----
    rag_top_k: int = 5
    #: Cosine distance (0 = identical, 2 = opposite). Chunks farther than this are ignored.
    rag_max_distance: float = 0.75

    @field_validator(*_OPTIONAL_FIELDS, mode="before")
    @classmethod
    def _empty_string_is_unset(cls, value: Any) -> Any:
        return None if isinstance(value, str) and value.strip() == "" else value

    @field_validator("embedding_dim")
    @classmethod
    def _positive_dim(cls, value: int) -> int:
        if value < 1:
            raise ValueError("EMBEDDING_DIM must be a positive number")
        return value

    # ---- Derived values ----
    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def json_logs(self) -> bool:
        return self.is_production if self.log_json is None else self.log_json

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def resolved_llm_model(self) -> str:
        return self.llm_model or DEFAULT_LLM_MODELS[self.llm_provider]

    @property
    def resolved_llm_base_url(self) -> str | None:
        return self.llm_base_url or OPENAI_COMPAT_BASE_URLS.get(self.llm_provider)

    @property
    def resolved_embedding_api_key(self) -> str | None:
        """EMBEDDING_API_KEY, or the LLM key when both use the same provider."""
        if self.embedding_api_key:
            return self.embedding_api_key.get_secret_value()
        if self.llm_api_key and self.llm_provider == self.embedding_provider:
            return self.llm_api_key.get_secret_value()
        return None

    @property
    def resolved_embedding_base_url(self) -> str | None:
        return self.embedding_base_url or OPENAI_COMPAT_BASE_URLS.get(self.embedding_provider)


@lru_cache
def get_settings() -> Settings:
    return Settings()
