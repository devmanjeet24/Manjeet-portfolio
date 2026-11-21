"""Fast tests that need no database, network or API key."""

import math
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.engine import make_url

from app.core.config import Settings, get_settings
from app.core.security import SlidingWindowLimiter, hash_ip
from app.db.session import DatabaseNotConfigured, build_engine_args
from app.services import rag
from app.services.ingest import find_files, prepare_chunks
from app.services.llm import (
    ChatMessage,
    EmbeddingError,
    HashEmbedder,
    MockProvider,
    ProviderNotConfigured,
    build_embedder,
    build_llm,
)


# ---- configuration -------------------------------------------------------------------
def test_origins_are_split_and_trimmed():
    s = Settings(_env_file=None, allowed_origins="https://a.com/, http://localhost:3000 ,,")
    assert s.allowed_origins_list == ["https://a.com", "http://localhost:3000"]


def test_no_origins_by_default():
    assert Settings(_env_file=None).allowed_origins_list == []


def test_empty_strings_count_as_unset(monkeypatch):
    monkeypatch.setenv("LLM_EFFORT", "")
    monkeypatch.setenv("LLM_MODEL", "  ")
    monkeypatch.setenv("LLM_TEMPERATURE", "")
    s = Settings(_env_file=None)
    assert s.llm_effort is None and s.llm_model is None and s.llm_temperature is None
    assert s.resolved_llm_model == "claude-opus-5-5"


def test_embedding_key_falls_back_to_llm_key_only_for_same_provider():
    same = Settings(_env_file=None, llm_provider="openai", llm_api_key="k1", embedding_provider="openai")
    other = Settings(_env_file=None, llm_provider="anthropic", llm_api_key="k1", embedding_provider="openai")
    explicit = Settings(_env_file=None, llm_provider="anthropic", llm_api_key="k1", embedding_api_key="k2")
    assert same.resolved_embedding_api_key == "k1"
    assert other.resolved_embedding_api_key is None
    assert explicit.resolved_embedding_api_key == "k2"


def test_provider_base_urls():
    assert "groq" in Settings(_env_file=None, llm_provider="groq").resolved_llm_base_url
    assert "generativelanguage" in Settings(_env_file=None, llm_provider="gemini").resolved_llm_base_url
    assert Settings(_env_file=None, llm_provider="openai").resolved_llm_base_url is None


def test_unknown_provider_is_rejected():
    with pytest.raises(ValueError):
        Settings(_env_file=None, llm_provider="llama-farm")


# ---- database url (the Neon address) --------------------------------------------------
def test_neon_url_becomes_asyncpg():
    url, args = build_engine_args(
        "postgresql://user:pw@ep-cool-1234.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    )
    assert url.drivername == "postgresql+asyncpg"
    assert "sslmode" not in url.query and "channel_binding" not in url.query
    assert args == {"ssl": "require"}


def test_pooled_neon_host_turns_prepared_statements_off():
    url, args = build_engine_args("postgres://u:p@ep-x-pooler.neon.tech/db?sslmode=require")
    assert url.drivername == "postgresql+asyncpg"
    assert args["statement_cache_size"] == 0
    assert url.query["prepared_statement_cache_size"] == "0"


def test_local_url_has_no_ssl():
    url, args = build_engine_args("postgresql://postgres@localhost:5432/dev")
    assert args == {} and make_url(url).host == "localhost"


def test_missing_database_url():
    with pytest.raises(DatabaseNotConfigured):
        build_engine_args("")


# ---- security helpers -----------------------------------------------------------------
def test_limiter_blocks_then_recovers():
    limiter = SlidingWindowLimiter(limit=3, window_seconds=60)
    assert [limiter.check("ip", now=t)[0] for t in (0, 1, 2)] == [True, True, True]
    allowed, retry = limiter.check("ip", now=3)
    assert not allowed and 55 <= retry <= 61
    assert limiter.check("other", now=3)[0]  # other keys are independent
    assert limiter.check("ip", now=61)[0]  # the first hit has aged out


def test_limiter_forgets_old_keys():
    limiter = SlidingWindowLimiter(limit=1, window_seconds=10, max_keys=5)
    for i in range(20):
        limiter.check(f"ip{i}", now=float(i * 100))
    assert len(limiter._hits) <= 6


def test_ip_hash_is_stable_keyed_and_hides_the_ip():
    a = hash_ip("203.0.113.9")
    assert a == hash_ip("203.0.113.9") and a != hash_ip("203.0.113.10")
    assert "203" not in a and len(a) == 64


# ---- embeddings and the model layer ---------------------------------------------------
async def test_hash_embedder_is_normalised_and_prefers_shared_words():
    emb = HashEmbedder(Settings(_env_file=None, embedding_dim=256))
    a, b, c = await emb.embed_documents(
        ["react and node projects", "projects built with react", "chocolate cake recipe"]
    )
    assert len(a) == 256 and math.isclose(sum(x * x for x in a), 1.0, rel_tol=1e-6)
    dot = lambda u, v: sum(x * y for x, y in zip(u, v, strict=True))  # noqa: E731
    assert dot(a, b) > dot(a, c)


def test_embedder_dimension_check():
    emb = HashEmbedder(Settings(_env_file=None, embedding_dim=4))
    with pytest.raises(EmbeddingError):
        emb._check_dim([[0.1, 0.2]])


def test_missing_keys_give_clear_errors():
    with pytest.raises(ProviderNotConfigured, match="LLM_API_KEY"):
        build_llm(Settings(_env_file=None, llm_provider="anthropic"))
    with pytest.raises(ProviderNotConfigured, match="EMBEDDING_API_KEY"):
        build_embedder(Settings(_env_file=None, llm_provider="anthropic", llm_api_key="k"))


async def test_mock_provider_streams_in_pieces():
    llm = MockProvider(Settings(_env_file=None, llm_provider="mock"))
    pieces = [
        p async for p in llm.stream(system="s", messages=[ChatMessage("user", "hello there")], max_tokens=50)
    ]
    assert len(pieces) > 1 and "hello there" in "".join(pieces)


# ---- RAG helpers ---------------------------------------------------------------------
def test_history_is_trimmed_and_starts_with_a_user_turn():
    history = [
        ChatMessage("user", "1"),
        ChatMessage("assistant", "2"),
        ChatMessage("user", "3"),
        ChatMessage("assistant", "4"),
    ]
    trimmed = rag.trim_history(history, 3)
    assert [m.content for m in trimmed] == ["3", "4"]
    assert rag.trim_history(history, 0) == []


def test_short_follow_ups_search_with_the_previous_question():
    history = [ChatMessage("user", "what projects has he built"), ChatMessage("assistant", "Several.")]
    assert rag.retrieval_query("and node?", history) == "what projects has he built and node?"
    long_q = "Tell me everything about his experience with distributed systems and databases please"
    assert rag.retrieval_query(long_q, history) == long_q


def test_system_prompt_wraps_context_and_guards_against_injection():
    chunks = [rag.RetrievedChunk(1, "about.md", "He likes React.", 0.2)]
    prompt = rag.build_system_prompt("Jane Roe", chunks)
    assert "Jane Roe" in prompt and "[1] (from about.md)\nHe likes React." in prompt
    assert "<context>" in prompt and "not instructions" in prompt


def test_public_error_codes_hide_setup_details():
    assert rag.public_code("auth_failed") == "unavailable"
    assert rag.public_code("rate_limited") == "rate_limited"


# ---- ingestion -----------------------------------------------------------------------
def test_ingest_finds_files_and_strips_comments(tmp_path: Path):
    (tmp_path / "a.md").write_text("<!-- note to self -->\n# Title\n\nSome real text about me.")
    (tmp_path / "sub").mkdir()
    (tmp_path / "sub" / "b.txt").write_text("Plain text file.")
    (tmp_path / "ignore.png").write_bytes(b"x")
    (tmp_path / ".hidden.md").write_text("secret")
    files = find_files(tmp_path)
    assert [f.name for f in files] == ["a.md", "b.txt"]

    chunks = prepare_chunks(files[0], tmp_path)
    assert chunks and "note to self" not in chunks[0].page_content
    assert chunks[0].metadata["source"] == "a.md" and chunks[0].metadata["chunk"] == 0
    assert prepare_chunks(files[1], tmp_path)[0].metadata["source"] == "sub/b.txt"


def test_long_text_is_split_with_overlap(tmp_path: Path):
    (tmp_path / "long.txt").write_text(("word " * 600).strip())
    chunks = prepare_chunks(tmp_path / "long.txt", tmp_path, chunk_size=300, chunk_overlap=50)
    assert len(chunks) > 5 and all(len(c.page_content) <= 300 for c in chunks)


# ---- the app itself ------------------------------------------------------------------
@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGINS", "https://site.example")
    monkeypatch.setenv("LLM_PROVIDER", "mock")
    get_settings.cache_clear()
    from app.main import create_app

    with TestClient(create_app()) as c:
        yield c


def test_health_and_docs_work_without_a_database(client):
    assert client.get("/health").json()["status"] == "ok"
    assert client.get("/docs").status_code == 200
    ready = client.get("/health/ready")
    assert ready.status_code == 503 and ready.json()["database"] == "not_configured"


def test_cors_allows_only_listed_origins(client):
    ask = {"Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type"}
    ok = client.options("/api/chat", headers={"Origin": "https://site.example", **ask})
    assert ok.headers["access-control-allow-origin"] == "https://site.example"
    bad = client.options("/api/chat", headers={"Origin": "https://evil.example", **ask})
    assert "access-control-allow-origin" not in bad.headers


def test_request_id_is_returned_and_echoed(client):
    assert client.get("/health").headers["x-request-id"]
    assert client.get("/health", headers={"X-Request-ID": "trace-1"}).headers["x-request-id"] == "trace-1"


def test_chat_validates_input(client):
    post = lambda **body: client.post("/api/chat", json=body)  # noqa: E731
    assert post(session_id="short", message="hi").status_code == 422
    assert post(session_id="session-1234", message="   ").status_code == 422
    assert post(session_id="session-1234", message="x" * 1500).status_code == 413


def test_chat_says_so_when_nothing_is_configured(client):
    r = client.post("/api/chat", json={"session_id": "session-1234", "message": "hi", "stream": False})
    assert r.status_code == 503 and r.json()["code"] == "unavailable"


def test_chat_is_rate_limited(client, monkeypatch):
    monkeypatch.setenv("CHAT_RATE_LIMIT_PER_MINUTE", "2")
    get_settings.cache_clear()
    from app.core.security import get_chat_limiter

    get_chat_limiter.cache_clear()
    codes = [
        client.post(
            "/api/chat", json={"session_id": "session-1234", "message": "hi", "stream": False}
        ).status_code
        for _ in range(4)
    ]
    assert codes[:2] == [503, 503] and codes[2:] == [429, 429]


def test_docs_can_be_switched_off(monkeypatch):
    monkeypatch.setenv("ENABLE_DOCS", "false")
    get_settings.cache_clear()
    from app.main import create_app

    with TestClient(create_app()) as c:
        assert c.get("/docs").status_code == 404 and c.get("/openapi.json").status_code == 404
        assert c.get("/health").status_code == 200


def test_pdf_pages_are_ingested_with_page_numbers(tmp_path: Path):
    lines = ["BT /F1 14 Tf 72 700 Td (Manjeet builds web apps with React and Python.) Tj ET"]
    stream = "\n".join(lines)
    objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R "
        "/Resources << /Font << /F1 5 0 R >> >> >>",
        f"<< /Length {len(stream)} >>\nstream\n{stream}\nendstream",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    pdf = b"%PDF-1.4\n"
    offsets = []
    for number, body in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf += f"{number} 0 obj\n{body}\nendobj\n".encode()
    xref = len(pdf)
    pdf += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
    pdf += b"".join(f"{o:010d} 00000 n \n".encode() for o in offsets)
    pdf += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    (tmp_path / "cv.pdf").write_bytes(pdf)

    chunks = prepare_chunks(tmp_path / "cv.pdf", tmp_path)
    assert "React and Python" in chunks[0].page_content
    assert chunks[0].metadata["page"] == 1 and chunks[0].metadata["source"] == "cv.pdf"
