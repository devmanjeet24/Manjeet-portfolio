"""Provider-agnostic LLM and embedding layer.

The rest of the app only knows two small interfaces, `LLMProvider` and `Embedder`. Which
provider answers is decided by environment variables (LLM_PROVIDER, EMBEDDING_PROVIDER), so
switching between Anthropic, OpenAI, Groq and Gemini never touches the chat code.

  anthropic          the official `anthropic` SDK (Claude)
  openai/groq/gemini the official `openai` SDK, pointed at each service's OpenAI-compatible API
  local              a real embedding model run on this machine (optional, via fastembed)
  mock / hash        offline stand-ins for tests and local development (no API key, no cost)
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
import math
import re
from abc import ABC, abstractmethod
from collections.abc import AsyncIterator, Sequence
from dataclasses import dataclass
from functools import lru_cache
from typing import Literal

import anthropic
import openai

from app.core.config import Settings, get_settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------------------
# Errors: providers translate their SDK's exceptions into these, so callers see one set.
# ---------------------------------------------------------------------------------------
class LLMError(Exception):
    """Base class. `code` is a short machine-readable reason."""

    code = "llm_error"


class ProviderNotConfigured(LLMError):
    code = "not_configured"


class ProviderAuthError(LLMError):
    code = "auth_failed"


class ProviderBusy(LLMError):
    code = "rate_limited"


class ProviderUnavailable(LLMError):
    code = "unavailable"


class ProviderRefused(LLMError):
    """The model declined to answer (a safety refusal)."""

    code = "refused"


@dataclass(frozen=True)
class ChatMessage:
    role: Literal["user", "assistant"]
    content: str


# ---------------------------------------------------------------------------------------
# Chat models
# ---------------------------------------------------------------------------------------
class LLMProvider(ABC):
    name: str
    model: str

    @abstractmethod
    def stream(self, *, system: str, messages: Sequence[ChatMessage], max_tokens: int) -> AsyncIterator[str]:
        """Yield the answer in pieces as it is written."""

    async def complete(self, *, system: str, messages: Sequence[ChatMessage], max_tokens: int) -> str:
        return "".join(
            [piece async for piece in self.stream(system=system, messages=messages, max_tokens=max_tokens)]
        )


# Models that accept the server-side refusal fallback (see the Claude API docs).
_FALLBACK_MODELS = {
    "claude-opus-5-5",
    "claude-opus-5",
    "claude-sonnet-5-5",
    "claude-fable-5-2",
    "claude-fable-5-1",
    "claude-fable-5",
}
_FALLBACK_BETA = "server-side-fallback-2026-07-01"


class AnthropicProvider(LLMProvider):
    name = "anthropic"

    def __init__(self, settings: Settings, model: str | None = None) -> None:
        if not settings.llm_api_key:
            raise ProviderNotConfigured("LLM_API_KEY is not set (needed for LLM_PROVIDER=anthropic)")
        self.model = model or settings.resolved_llm_model
        self._effort = settings.llm_effort
        self._fallback = settings.anthropic_refusal_fallback and self.model in _FALLBACK_MODELS
        self._client = anthropic.AsyncAnthropic(
            api_key=settings.llm_api_key.get_secret_value(),
            base_url=settings.llm_base_url,  # None = the real API
            timeout=60.0,
            max_retries=2,
        )

    async def stream(
        self, *, system: str, messages: Sequence[ChatMessage], max_tokens: int
    ) -> AsyncIterator[str]:
        # No temperature/top_p: the current Claude models reject them. Depth is set with effort.
        params: dict = {
            "model": self.model,
            "max_tokens": max_tokens,
            "system": system,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
        }
        if self._effort:
            params["output_config"] = {"effort": self._effort}
        try:
            if self._fallback:
                manager = self._client.beta.messages.stream(
                    **params, betas=[_FALLBACK_BETA], fallbacks="default"
                )
            else:
                manager = self._client.messages.stream(**params)
            async with manager as stream:
                async for text in stream.text_stream:
                    yield text
                final = await stream.get_final_message()
            if final.stop_reason == "refusal":
                raise ProviderRefused("The model declined this request")
        except anthropic.AuthenticationError as exc:
            raise ProviderAuthError("The LLM API key was rejected") from exc
        except anthropic.RateLimitError as exc:
            raise ProviderBusy("The LLM provider is rate limiting requests") from exc
        except anthropic.APIStatusError as exc:
            logger.error("anthropic error", extra={"status": exc.status_code, "type": exc.type})
            raise ProviderUnavailable(f"The LLM provider returned an error ({exc.status_code})") from exc
        except anthropic.APIConnectionError as exc:
            raise ProviderUnavailable("Could not reach the LLM provider") from exc
        except LLMError:
            raise
        except Exception as exc:  # e.g. a connection cut mid-stream that the SDK did not wrap
            logger.exception("unexpected error from the LLM client")
            raise ProviderUnavailable("The connection to the LLM provider failed") from exc


class OpenAICompatProvider(LLMProvider):
    """OpenAI, Groq and Gemini (through its OpenAI-compatible endpoint)."""

    def __init__(self, settings: Settings, model: str | None = None) -> None:
        self.name = settings.llm_provider
        if not settings.llm_api_key:
            raise ProviderNotConfigured(f"LLM_API_KEY is not set (needed for LLM_PROVIDER={self.name})")
        self.model = model or settings.resolved_llm_model
        self._temperature = settings.llm_temperature
        self._client = openai.AsyncOpenAI(
            api_key=settings.llm_api_key.get_secret_value(),
            base_url=settings.resolved_llm_base_url,
            timeout=60.0,
            max_retries=2,
        )
        # OpenAI's newer models want `max_completion_tokens`; the others still use `max_tokens`.
        self._token_param = "max_completion_tokens" if self.name == "openai" else "max_tokens"

    async def stream(
        self, *, system: str, messages: Sequence[ChatMessage], max_tokens: int
    ) -> AsyncIterator[str]:
        params: dict = {
            "model": self.model,
            "messages": [{"role": "system", "content": system}]
            + [{"role": m.role, "content": m.content} for m in messages],
            "stream": True,
            self._token_param: max_tokens,
        }
        if self._temperature is not None:
            params["temperature"] = self._temperature
        try:
            response = await self._client.chat.completions.create(**params)
            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except openai.AuthenticationError as exc:
            raise ProviderAuthError("The LLM API key was rejected") from exc
        except openai.RateLimitError as exc:
            raise ProviderBusy("The LLM provider is rate limiting requests") from exc
        except openai.APIStatusError as exc:
            logger.error("llm error", extra={"provider": self.name, "status": exc.status_code})
            raise ProviderUnavailable(f"The LLM provider returned an error ({exc.status_code})") from exc
        except openai.APIConnectionError as exc:
            raise ProviderUnavailable("Could not reach the LLM provider") from exc
        except Exception as exc:  # e.g. a connection cut mid-stream that the SDK did not wrap
            logger.exception("unexpected error from the LLM client")
            raise ProviderUnavailable("The connection to the LLM provider failed") from exc


class MockProvider(LLMProvider):
    """Offline stand-in: no network, no key. It echoes what it was given, in a few pieces."""

    name = "mock"

    def __init__(self, settings: Settings, model: str | None = None) -> None:
        self.model = model or settings.resolved_llm_model

    async def stream(
        self, *, system: str, messages: Sequence[ChatMessage], max_tokens: int
    ) -> AsyncIterator[str]:
        question = messages[-1].content if messages else ""
        has_context = "<context>" in system and "[1]" in system
        text = (
            f"(mock model) You asked: {question!r}. "
            f"{'I was given knowledge-base context.' if has_context else 'I had no context.'}"
        )
        words = text.split(" ")
        for i in range(0, len(words), 4):
            yield " ".join(words[i : i + 4]) + (" " if i + 4 < len(words) else "")


def build_llm(settings: Settings, model: str | None = None) -> LLMProvider:
    """The chat model for LLM_PROVIDER. `model` overrides LLM_MODEL (used for the condense step)."""
    if settings.llm_provider == "anthropic":
        return AnthropicProvider(settings, model)
    if settings.llm_provider in {"openai", "groq", "gemini"}:
        return OpenAICompatProvider(settings, model)
    if settings.llm_provider == "mock":
        return MockProvider(settings, model)
    raise ProviderNotConfigured(f"Unknown LLM_PROVIDER: {settings.llm_provider}")


@lru_cache
def get_llm() -> LLMProvider:
    return build_llm(get_settings())


@lru_cache
def get_condense_llm() -> LLMProvider:
    """The model that rewrites follow-up questions: LLM_CONDENSE_MODEL, or the main model."""
    settings = get_settings()
    return build_llm(settings, settings.llm_condense_model) if settings.llm_condense_model else get_llm()


# ---------------------------------------------------------------------------------------
# Embeddings
# ---------------------------------------------------------------------------------------
class EmbeddingError(LLMError):
    code = "embedding_failed"


class Embedder(ABC):
    name: str
    model: str
    dim: int

    @abstractmethod
    async def embed_documents(self, texts: Sequence[str]) -> list[list[float]]: ...

    async def embed_query(self, text: str) -> list[float]:
        return (await self.embed_documents([text]))[0]

    def _check_dim(self, vectors: list[list[float]]) -> list[list[float]]:
        for vector in vectors:
            if len(vector) != self.dim:
                raise EmbeddingError(
                    f"{self.model} returned {len(vector)} numbers per vector, but EMBEDDING_DIM is "
                    f"{self.dim}. They must match the database column (changing it needs a new migration)."
                )
        return vectors


class OpenAICompatEmbedder(Embedder):
    BATCH = 64

    def __init__(self, settings: Settings) -> None:
        self.name = settings.embedding_provider
        key = settings.resolved_embedding_api_key
        if not key:
            raise ProviderNotConfigured(
                f"EMBEDDING_API_KEY is not set (needed for EMBEDDING_PROVIDER={self.name}; "
                "it can be left out only when LLM_PROVIDER is the same provider)"
            )
        self.model = settings.embedding_model
        self.dim = settings.embedding_dim
        self._client = openai.AsyncOpenAI(
            api_key=key, base_url=settings.resolved_embedding_base_url, timeout=60.0, max_retries=2
        )
        # These model families can shorten their vectors on request; older ones cannot.
        self._send_dimensions = self.model.startswith(("text-embedding-3", "gemini-embedding"))

    async def embed_documents(self, texts: Sequence[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        try:
            for start in range(0, len(texts), self.BATCH):
                batch = list(texts[start : start + self.BATCH])
                kwargs = {"dimensions": self.dim} if self._send_dimensions else {}
                response = await self._client.embeddings.create(model=self.model, input=batch, **kwargs)
                vectors.extend(item.embedding for item in sorted(response.data, key=lambda d: d.index))
        except openai.AuthenticationError as exc:
            raise ProviderAuthError("The embedding API key was rejected") from exc
        except openai.RateLimitError as exc:
            raise ProviderBusy("The embedding provider is rate limiting requests") from exc
        except openai.APIStatusError as exc:
            raise EmbeddingError(f"The embedding provider returned an error ({exc.status_code})") from exc
        except openai.APIConnectionError as exc:
            raise EmbeddingError("Could not reach the embedding provider") from exc
        except LLMError:
            raise
        except Exception as exc:
            logger.exception("unexpected error from the embedding client")
            raise EmbeddingError("The connection to the embedding provider failed") from exc
        return self._check_dim(vectors)


_STOPWORD_TEXT = """
a an the and or but if of to in on at by for with from as is are was were be been being do does did
has have had he she they it its his her their him them this that these those what which who whom how
when where why can could should would will may might about into than then so such not no yes any all
more most some tell me you your i my we our us please also there here
"""
_STOPWORDS = frozenset(re.findall(r"[a-z]+", _STOPWORD_TEXT))


def _tokens(text: str) -> list[str]:
    """Lower-case words without filler words, with a crude plural/-ing/-ed trim."""
    words = []
    for word in re.findall(r"[a-z0-9]+", text.lower()):
        if word in _STOPWORDS:
            continue
        for suffix in ("ing", "ed", "es", "s"):
            if len(word) > len(suffix) + 3 and word.endswith(suffix):
                word = word[: -len(suffix)]
                break
        words.append(word)
    return words


class HashEmbedder(Embedder):
    """Offline stand-in for development and tests: hashes words into a fixed-size vector.

    Texts that share (non-filler) words end up near each other, but it understands no meaning:
    "job" and "work" are unrelated to it. Do not use it for the real site: set
    EMBEDDING_PROVIDER to openai or gemini.
    """

    name = "hash"

    def __init__(self, settings: Settings) -> None:
        self.model = "hash"
        self.dim = settings.embedding_dim

    async def embed_documents(self, texts: Sequence[str]) -> list[list[float]]:
        return [self._embed(text) for text in texts]

    def _embed(self, text: str) -> list[float]:
        counts: dict[str, int] = {}
        for word in _tokens(text):
            counts[word] = counts.get(word, 0) + 1
        vector = [0.0] * self.dim
        for word, count in counts.items():
            digest = hashlib.blake2b(word.encode(), digest_size=8).digest()
            index = int.from_bytes(digest[:4], "big") % self.dim
            sign = 1.0 if digest[4] & 1 else -1.0
            vector[index] += sign * (1.0 + math.log(count))  # repeated words count, with diminishing returns
        norm = math.sqrt(sum(v * v for v in vector)) or 1.0
        return [v / norm for v in vector]


class LocalEmbedder(Embedder):
    """A real embedding model that runs on this machine through `fastembed` (ONNX): no API key,
    no cost, no data leaves the server. Optional: `pip install -r requirements-local.txt`.

    Suggested: EMBEDDING_MODEL=BAAI/bge-small-en-v1.5 with EMBEDDING_DIM=384 (English). The model
    (about 130 MB) is downloaded on first use. It needs a few hundred MB of memory, so it suits
    development and bigger servers more than a small free-tier instance.
    """

    name = "local"

    def __init__(self, settings: Settings) -> None:
        try:
            from fastembed import TextEmbedding
        except ImportError as exc:
            raise ProviderNotConfigured(
                "EMBEDDING_PROVIDER=local needs fastembed: pip install -r requirements-local.txt"
            ) from exc
        self.model = settings.embedding_model
        self.dim = settings.embedding_dim
        self._model = TextEmbedding(self.model)

    async def embed_documents(self, texts: Sequence[str]) -> list[list[float]]:
        # The model is CPU work: keep it off the event loop. `passage_embed` is for stored text.
        vectors = await asyncio.to_thread(
            lambda: [v.tolist() for v in self._model.passage_embed(list(texts))]
        )
        return self._check_dim(vectors)

    async def embed_query(self, text: str) -> list[float]:
        # Retrieval models treat questions and passages slightly differently.
        vectors = await asyncio.to_thread(lambda: [v.tolist() for v in self._model.query_embed(text)])
        return self._check_dim(vectors)[0]


def build_embedder(settings: Settings) -> Embedder:
    if settings.embedding_provider == "hash":
        return HashEmbedder(settings)
    if settings.embedding_provider == "local":
        return LocalEmbedder(settings)
    return OpenAICompatEmbedder(settings)


@lru_cache
def get_embedder() -> Embedder:
    return build_embedder(get_settings())
