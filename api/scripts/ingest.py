"""Load the knowledge base into the database.

    python -m scripts.ingest                      # everything in ./knowledge
    python -m scripts.ingest --path docs/cv.pdf   # one file
    python -m scripts.ingest --dry-run            # show the passages, change nothing

Re-running replaces a file's old passages (use --keep to add instead).
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys
from pathlib import Path

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db.session import DatabaseNotConfigured, dispose_engine, get_session_factory
from app.services.ingest import find_files, ingest_path, prepare_chunks
from app.services.llm import LLMError, get_embedder

logger = logging.getLogger("ingest")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument(
        "--path", type=Path, default=Path("knowledge"), help="file or folder (default: knowledge)"
    )
    parser.add_argument("--chunk-size", type=int, default=800, help="characters per passage (default 800)")
    parser.add_argument(
        "--chunk-overlap", type=int, default=120, help="characters shared by neighbours (default 120)"
    )
    parser.add_argument("--keep", action="store_true", help="add passages without removing a file's old ones")
    parser.add_argument(
        "--dry-run", action="store_true", help="split and print only; no embeddings, no database"
    )
    return parser.parse_args(argv)


def check_files(path: Path) -> list[Path]:
    """The files to load, or an explanation and an empty list."""
    if not path.exists():
        print(f"Nothing at {path}", file=sys.stderr)
        return []
    files = find_files(path)
    if not files:
        print(f"No .md, .txt or .pdf files under {path}", file=sys.stderr)
    return files


async def run(args: argparse.Namespace, files: list[Path]) -> int:
    path: Path = args.path
    if args.dry_run:
        total = 0
        for file in files:
            chunks = prepare_chunks(file, path, chunk_size=args.chunk_size, chunk_overlap=args.chunk_overlap)
            total += len(chunks)
            print(f"{file}: {len(chunks)} passages")
            for chunk in chunks[:2]:
                print(f"    - {chunk.page_content[:80]!r}")
        print(f"\n{len(files)} file(s), {total} passages (dry run: nothing was stored)")
        return 0

    try:
        stats = await ingest_path(
            get_session_factory(),
            get_embedder(),
            path,
            replace=not args.keep,
            chunk_size=args.chunk_size,
            chunk_overlap=args.chunk_overlap,
        )
    except DatabaseNotConfigured:
        print("DATABASE_URL is not set. Copy .env.example to .env and fill it in.", file=sys.stderr)
        return 1
    except LLMError as exc:
        print(f"Embedding failed: {exc}", file=sys.stderr)
        return 1
    finally:
        await dispose_engine()

    print(f"Done: {stats.files} file(s), {stats.chunks} passages stored, {stats.replaced} old ones replaced.")
    return 0


def main() -> None:
    settings = get_settings()
    configure_logging(settings.log_level, json_logs=False)
    args = parse_args()
    files = check_files(args.path)
    if not files:
        sys.exit(1)
    sys.exit(asyncio.run(run(args, files)))


if __name__ == "__main__":
    main()
