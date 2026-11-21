"""Load documents, cut them into passages, embed them and store them.

Re-running is safe: a file whose content (and chunking settings and embedding model) did not
change is skipped, a changed file has its old passages replaced in one transaction, and passages
of files that no longer exist are removed.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
import re
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path

from langchain_core.documents import Document
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from pypdf import PdfReader
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models import DocumentChunk
from app.services.llm import Embedder

logger = logging.getLogger(__name__)

SUPPORTED_SUFFIXES = {".md", ".txt", ".pdf"}
DEFAULT_CHUNK_SIZE = 600
DEFAULT_CHUNK_OVERLAP = 100
#: Passages with less text than this (headings aside) carry no knowledge and are dropped.
MIN_CHUNK_CHARS = 40
_HTML_COMMENT = re.compile(r"<!--.*?-->", re.DOTALL)
_HEADERS = [("#", "h1"), ("##", "h2"), ("###", "h3")]


@dataclass(frozen=True)
class IngestStats:
    files: int
    chunks: int  # passages written this run
    skipped: int  # files that had not changed
    replaced: int  # old passages removed because their file changed
    pruned: int  # passages removed because their file is gone


# ---------------------------------------------------------------------------------------
# Loading
# ---------------------------------------------------------------------------------------
def find_files(path: Path) -> list[Path]:
    """The supported files under `path` (or `path` itself if it is a file), in a stable order."""
    if path.is_file():
        return [path] if path.suffix.lower() in SUPPORTED_SUFFIXES else []
    return sorted(
        p
        for p in path.rglob("*")
        if p.is_file() and p.suffix.lower() in SUPPORTED_SUFFIXES and not p.name.startswith(".")
    )


def source_name(file: Path, root: Path) -> str:
    """How a file is called in the database: its path relative to the knowledge folder."""
    return file.relative_to(root).as_posix() if root.is_dir() else file.name


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


# ---------------------------------------------------------------------------------------
# Splitting
# ---------------------------------------------------------------------------------------
def _breadcrumb(metadata: dict[str, str]) -> str:
    return " > ".join(metadata[key] for key in ("h1", "h2", "h3") if metadata.get(key))


def split_markdown(documents: Sequence[Document], *, chunk_size: int, chunk_overlap: int) -> list[Document]:
    """Cut at headings first, then by size. Each passage starts with its heading path
    ("Projects > Commerce Platform"), so a passage that only says "Stack: React" still knows
    which project it is about."""
    by_header = MarkdownHeaderTextSplitter(_HEADERS, strip_headers=True)
    sizer = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    pieces: list[Document] = []
    for document in documents:
        sections = by_header.split_text(document.page_content)
        for piece in sizer.split_documents(sections):
            body = piece.page_content.strip()
            if len(body) < MIN_CHUNK_CHARS:
                continue
            crumb = _breadcrumb(piece.metadata)
            piece.metadata = {"heading": crumb} if crumb else {}
            piece.page_content = f"{crumb}\n\n{body}" if crumb else body
            pieces.append(piece)
    return pieces


def split_plain(documents: Sequence[Document], *, chunk_size: int, chunk_overlap: int) -> list[Document]:
    sizer = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    return [
        d for d in sizer.split_documents(list(documents)) if len(d.page_content.strip()) >= MIN_CHUNK_CHARS
    ]


def prepare_chunks(
    file: Path,
    root: Path,
    *,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[Document]:
    """Passages for one file. Metadata: source, chunk number, file type, heading (markdown), page (pdf)."""
    documents = load_file(file)
    split = split_markdown if file.suffix.lower() == ".md" else split_plain
    chunks = split(documents, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    source = source_name(file, root)
    for index, chunk in enumerate(chunks):
        chunk.metadata = {
            **chunk.metadata,
            "source": source,
            "chunk": index,
            "file_type": file.suffix.lower().lstrip("."),
        }
    return chunks


def fingerprint(file: Path, embedder: Embedder, chunk_size: int, chunk_overlap: int) -> str:
    """Changes when the file, the chunking settings or the embedding model change."""
    digest = hashlib.sha256()
    digest.update(file.read_bytes())
    digest.update(f"|{chunk_size}|{chunk_overlap}|{embedder.name}|{embedder.model}|{embedder.dim}".encode())
    return digest.hexdigest()[:32]


# ---------------------------------------------------------------------------------------
# Storing
# ---------------------------------------------------------------------------------------
async def is_up_to_date(session: AsyncSession, source: str, expected_chunks: int, print_: str) -> bool:
    """True when the database already holds exactly this file's current passages."""
    marker = DocumentChunk.meta["fingerprint"].astext
    row = (
        await session.execute(
            select(func.count(DocumentChunk.id), func.min(marker), func.max(marker)).where(
                DocumentChunk.source == source
            )
        )
    ).one()
    count, low, high = row
    return count == expected_chunks and low == print_ and high == print_


async def store_chunks(
    session: AsyncSession,
    embedder: Embedder,
    source: str,
    chunks: Sequence[Document],
    *,
    replace: bool,
) -> int:
    """Embed `chunks` and insert them. With `replace`, the source's old passages go in the same
    transaction (embedding happens first, so a failed embedding changes nothing)."""
    vectors = await embedder.embed_documents([c.page_content for c in chunks]) if chunks else []
    replaced = 0
    if replace:
        result = await session.execute(delete(DocumentChunk).where(DocumentChunk.source == source))
        replaced = result.rowcount or 0
    session.add_all(
        DocumentChunk(source=source, content=c.page_content, embedding=v, meta=dict(c.metadata))
        for c, v in zip(chunks, vectors, strict=True)
    )
    await session.commit()
    return replaced


async def prune_sources(session: AsyncSession, keep: Sequence[str]) -> int:
    """Remove passages whose file is no longer in the knowledge folder."""
    if not keep:  # never wipe everything because a folder looked empty
        return 0
    result = await session.execute(delete(DocumentChunk).where(DocumentChunk.source.notin_(list(keep))))
    await session.commit()
    return result.rowcount or 0


async def ingest_path(
    session_factory: async_sessionmaker[AsyncSession],
    embedder: Embedder,
    path: Path,
    *,
    replace: bool = True,
    prune: bool | None = None,
    force: bool = False,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> IngestStats:
    """Load everything under `path` into the database.

    prune: also drop passages of files that disappeared. Default: yes for a folder, no for one file.
    force: re-embed even files that have not changed.
    """
    # File reading is blocking work: keep it off the event loop.
    files = await asyncio.to_thread(find_files, path)
    if prune is None:
        prune = replace and await asyncio.to_thread(path.is_dir)

    written = skipped = replaced = 0
    for file in files:
        chunks = await asyncio.to_thread(
            prepare_chunks, file, path, chunk_size=chunk_size, chunk_overlap=chunk_overlap
        )
        source = source_name(file, path)
        if not chunks:
            logger.warning("no text found, skipped", extra={"file": str(file)})
            continue
        print_ = await asyncio.to_thread(fingerprint, file, embedder, chunk_size, chunk_overlap)
        for chunk in chunks:
            chunk.metadata["fingerprint"] = print_

        async with session_factory() as session:
            if replace and not force and await is_up_to_date(session, source, len(chunks), print_):
                skipped += 1
                logger.info("unchanged, skipped", extra={"source": source})
                continue
            replaced += await store_chunks(session, embedder, source, chunks, replace=replace)
        written += len(chunks)
        logger.info("ingested", extra={"source": source, "chunks": len(chunks)})

    pruned = 0
    if prune:
        async with session_factory() as session:
            pruned = await prune_sources(session, [source_name(f, path) for f in files])
    return IngestStats(files=len(files), chunks=written, skipped=skipped, replaced=replaced, pruned=pruned)
