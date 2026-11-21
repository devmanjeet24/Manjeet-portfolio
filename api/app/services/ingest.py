"""Load documents, cut them into passages, embed them and store them."""

from __future__ import annotations

import logging
import re
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path

from langchain_core.documents import Document
from langchain_text_splitters import Language, RecursiveCharacterTextSplitter
from pypdf import PdfReader
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models import DocumentChunk
from app.services.llm import Embedder

logger = logging.getLogger(__name__)

SUPPORTED_SUFFIXES = {".md", ".txt", ".pdf"}
_HTML_COMMENT = re.compile(r"<!--.*?-->", re.DOTALL)


@dataclass(frozen=True)
class IngestStats:
    files: int
    chunks: int
    replaced: int


def find_files(path: Path) -> list[Path]:
    """The supported files under `path` (or `path` itself if it is a file), in a stable order."""
    if path.is_file():
        return [path] if path.suffix.lower() in SUPPORTED_SUFFIXES else []
    return sorted(
        p
        for p in path.rglob("*")
        if p.is_file() and p.suffix.lower() in SUPPORTED_SUFFIXES and not p.name.startswith(".")
    )


def _load_pdf(file: Path) -> list[Document]:
    """One Document per page (page numbers start at 1)."""
    pages = PdfReader(str(file)).pages
    return [
        Document(page_content=page.extract_text() or "", metadata={"page": number})
        for number, page in enumerate(pages, start=1)
    ]


def load_file(file: Path) -> list[Document]:
    if file.suffix.lower() == ".pdf":
        documents = _load_pdf(file)
    else:
        documents = [Document(page_content=file.read_text(encoding="utf-8"))]
    for document in documents:
        # HTML comments are notes for the author, not knowledge.
        document.page_content = _HTML_COMMENT.sub("", document.page_content).strip()
    return [d for d in documents if d.page_content]


def split_documents(
    documents: Sequence[Document], *, markdown: bool, chunk_size: int, chunk_overlap: int
) -> list[Document]:
    if markdown:
        splitter = RecursiveCharacterTextSplitter.from_language(
            Language.MARKDOWN, chunk_size=chunk_size, chunk_overlap=chunk_overlap
        )
    else:
        splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    return splitter.split_documents(list(documents))


def prepare_chunks(
    file: Path, root: Path, *, chunk_size: int = 800, chunk_overlap: int = 120
) -> list[Document]:
    """Passages for one file; each carries its `source` (path relative to `root`) in metadata."""
    source = file.relative_to(root).as_posix() if root.is_dir() else file.name
    chunks = split_documents(
        load_file(file),
        markdown=file.suffix.lower() == ".md",
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    for index, chunk in enumerate(chunks):
        chunk.metadata = {
            **chunk.metadata,
            "source": source,
            "chunk": index,
            "file_type": file.suffix.lower().lstrip("."),
        }
    return chunks


async def store_chunks(
    session: AsyncSession, embedder: Embedder, source: str, chunks: Sequence[Document], *, replace: bool
) -> int:
    """Embed `chunks` and insert them. With `replace`, the source's old passages go first."""
    replaced = 0
    if replace:
        result = await session.execute(delete(DocumentChunk).where(DocumentChunk.source == source))
        replaced = result.rowcount or 0
    if chunks:
        vectors = await embedder.embed_documents([c.page_content for c in chunks])
        session.add_all(
            DocumentChunk(source=source, content=c.page_content, embedding=v, meta=dict(c.metadata))
            for c, v in zip(chunks, vectors, strict=True)
        )
    await session.commit()
    return replaced


async def ingest_path(
    session_factory: async_sessionmaker[AsyncSession],
    embedder: Embedder,
    path: Path,
    *,
    replace: bool = True,
    chunk_size: int = 800,
    chunk_overlap: int = 120,
) -> IngestStats:
    files = find_files(path)
    total_chunks = 0
    total_replaced = 0
    for file in files:
        chunks = prepare_chunks(file, path, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        if not chunks:
            logger.warning("no text found, skipped", extra={"file": str(file)})
            continue
        source = chunks[0].metadata["source"]
        async with session_factory() as session:
            total_replaced += await store_chunks(session, embedder, source, chunks, replace=replace)
        total_chunks += len(chunks)
        logger.info("ingested", extra={"source": source, "chunks": len(chunks)})
    return IngestStats(files=len(files), chunks=total_chunks, replaced=total_replaced)
