"""Tests that need a real PostgreSQL with pgvector.

Skipped unless TEST_DATABASE_URL points at a throwaway database, e.g.
    TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5432/portfolio_itest pytest tests/test_database.py
The tables are created before and dropped after each test.
"""

import os
from pathlib import Path

import pytest
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import Settings
from app.db.models import Base, ChatLog, DocumentChunk
from app.db.session import build_engine_args
from app.services import rag
from app.services.ingest import ingest_path
from app.services.llm import ChatMessage, HashEmbedder, LLMProvider, MockProvider

URL = os.environ.get("TEST_DATABASE_URL")
pytestmark = pytest.mark.skipif(not URL, reason="set TEST_DATABASE_URL to run the database tests")


@pytest.fixture
async def factory():
    url, args = build_engine_args(URL)
    engine = create_async_engine(url, connect_args=args)
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
def embedder():
    return HashEmbedder(Settings(_env_file=None))


@pytest.fixture
def kb(tmp_path: Path) -> Path:
    (tmp_path / "skills.md").write_text(
        "# Skills\n\n## Frontend\n\nManjeet works with React, Next.js and TypeScript on the frontend.\n\n"
        "## Databases\n\nManjeet uses PostgreSQL and MongoDB for databases and data storage.\n"
    )
    (tmp_path / "faq.md").write_text(
        "# FAQ\n\n## Contact\n\nUse the contact form on this website to reach Manjeet by email.\n"
    )
    return tmp_path


async def count(factory, where=None):
    async with factory() as session:
        query = select(func.count(DocumentChunk.id))
        return await session.scalar(query.where(where) if where is not None else query)


async def test_ingest_is_safe_to_rerun(factory, embedder, kb):
    first = await ingest_path(factory, embedder, kb)
    assert (first.files, first.chunks, first.skipped, first.replaced) == (2, 3, 0, 0)
    assert await count(factory) == 3

    again = await ingest_path(factory, embedder, kb)  # nothing changed: nothing is re-embedded
    assert (again.chunks, again.skipped) == (0, 2) and await count(factory) == 3

    (kb / "faq.md").write_text(
        "# FAQ\n\n## Contact\n\nWrite to Manjeet through the contact form on this website, please.\n"
    )
    edited = await ingest_path(factory, embedder, kb)  # one file changed: only it is replaced
    assert (edited.chunks, edited.skipped, edited.replaced) == (1, 1, 1) and await count(factory) == 3

    forced = await ingest_path(factory, embedder, kb, force=True)
    assert (forced.chunks, forced.skipped, forced.replaced) == (3, 0, 3) and await count(factory) == 3


async def test_deleted_files_are_pruned_but_single_file_runs_do_not_prune(factory, embedder, kb):
    await ingest_path(factory, embedder, kb)
    only_one = await ingest_path(factory, embedder, kb / "skills.md")
    assert only_one.pruned == 0 and await count(factory) == 3  # faq.md untouched

    (kb / "faq.md").unlink()
    after = await ingest_path(factory, embedder, kb)
    assert after.pruned == 1 and await count(factory, DocumentChunk.source == "faq.md") == 0


async def test_a_failed_embedding_changes_nothing(factory, embedder, kb):
    await ingest_path(factory, embedder, kb)
    (kb / "faq.md").write_text(
        "# FAQ\n\n## Contact\n\nA new text that is long enough to be a passage, yes.\n"
    )

    class Broken(HashEmbedder):
        async def embed_documents(self, texts):
            raise RuntimeError("embedding service down")

    with pytest.raises(RuntimeError):
        await ingest_path(factory, Broken(Settings(_env_file=None)), kb, force=True)
    assert await count(factory) == 3  # the old passages are still there


def retriever(factory, embedder, **kw):
    settings = Settings(_env_file=None, **kw)
    return rag.build_retriever(settings, factory, embedder)


async def test_retriever_finds_the_right_passage_and_respects_the_cutoff(factory, embedder, kb):
    await ingest_path(factory, embedder, kb)
    docs = await retriever(factory, embedder, rag_max_distance=2.0).ainvoke("What databases does he use?")
    assert docs[0].metadata["source"] == "skills.md" and docs[0].metadata["heading"] == "Skills > Databases"
    assert docs[0].metadata["distance"] < docs[-1].metadata["distance"] or len(docs) == 1
    assert (
        await retriever(factory, embedder, rag_max_distance=0.0001).ainvoke("What databases does he use?")
        == []
    )
    assert len(await retriever(factory, embedder, rag_max_distance=2.0, rag_top_k=2).ainvoke("anything")) == 2
    plain = await retriever(factory, embedder, rag_max_distance=2.0, rag_use_mmr=False).ainvoke(
        "contact form"
    )
    assert plain[0].metadata["source"] == "faq.md"


class _Fixed(LLMProvider):
    name = "fixed"
    model = "fixed-1"

    def __init__(self, text):
        self.text = text

    async def stream(self, *, system, messages, max_tokens):
        yield self.text


async def run_turn(factory, embedder, question, history=(), *, llm=None, condense=None, save_log=True, **kw):
    kw.setdefault("rag_max_distance", 2.0)
    settings = Settings(_env_file=None, **kw)
    return [
        e
        async for e in rag.stream_answer(
            question=question,
            history=list(history),
            session_id="session-0001",
            ip_hash="h" * 64,
            session_factory=factory,
            settings=settings,
            llm=llm or MockProvider(settings),
            embedder=embedder,
            condense_llm=condense,
            debug=True,
            save_log=save_log,
        )
    ]


async def test_a_turn_streams_sources_then_tokens_then_done_and_is_logged(factory, embedder, kb):
    await ingest_path(factory, embedder, kb)
    events = await run_turn(factory, embedder, "What databases does he use?")
    assert [e.type for e in events][:2] == ["debug", "sources"] and events[-1].type == "done"
    assert any(e.type == "token" for e in events)
    done = events[-1].data
    assert done["grounded"] is True and "skills.md" in done["sources"]
    assert {"source": "skills.md", "heading": "Skills > Databases"} in done["references"]
    async with factory() as session:
        log = (await session.scalars(select(ChatLog))).one()
    assert log.question == "What databases does he use?" and log.ip_hash == "h" * 64 and log.answer


async def test_nothing_relevant_answers_with_the_fallback_without_calling_the_model(factory, embedder, kb):
    await ingest_path(factory, embedder, kb)

    class Boom(LLMProvider):
        name, model = "boom", "boom-1"

        async def stream(self, **_):
            raise AssertionError("the model must not be called")
            yield  # pragma: no cover

    events = await run_turn(
        factory, embedder, "What is the capital of France?", llm=Boom(), rag_max_distance=0.0001
    )
    text = "".join(e.data["text"] for e in events if e.type == "token")
    assert (
        "contact form" in text and events[-1].data["grounded"] is False and events[-1].data["sources"] == []
    )


async def test_follow_ups_are_condensed_before_searching(factory, embedder, kb):
    await ingest_path(factory, embedder, kb)
    history = [ChatMessage("user", "Tell me about his skills"), ChatMessage("assistant", "He knows React.")]
    condense = _Fixed("What databases does Manjeet use for data storage?")
    events = await run_turn(factory, embedder, "and for data?", history, condense=condense)
    debug = events[0].data
    assert debug["standalone_question"] == "What databases does Manjeet use for data storage?"
    assert debug["chunks"][0]["source"] == "skills.md"


async def test_a_provider_crash_becomes_an_error_event_not_a_cut_stream(factory, embedder, kb):
    await ingest_path(factory, embedder, kb)

    class Crash(LLMProvider):
        name, model = "crash", "crash-1"

        async def stream(self, **_):
            raise ConnectionResetError("connection cut")
            yield  # pragma: no cover

    events = await run_turn(factory, embedder, "What databases does he use?", llm=Crash())
    assert events[-1].type == "error" and events[-1].data["code"] == "internal_error"
    async with factory() as session:
        assert await session.scalar(select(func.count(ChatLog.id))) == 0  # failed turns are not logged


async def test_save_log_can_be_switched_off(factory, embedder, kb):
    await ingest_path(factory, embedder, kb)
    await run_turn(factory, embedder, "What databases does he use?", save_log=False)
    async with factory() as session:
        assert await session.scalar(select(func.count(ChatLog.id))) == 0
