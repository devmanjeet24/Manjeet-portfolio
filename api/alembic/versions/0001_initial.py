"""Create the pgvector extension, the document_chunks table and the chat_logs table.

The size of the embedding column comes from EMBEDDING_DIM at the time this migration runs.
To change it later, write a new migration (and re-ingest): never edit this one.

Revision ID: 0001
Revises:
Create Date: 2026-11-21
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects import postgresql

from app.core.config import get_settings

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# pgvector's HNSW index supports at most this many dimensions.
HNSW_MAX_DIM = 2000


def upgrade() -> None:
    dim = get_settings().embedding_dim

    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "document_chunks",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("source", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("embedding", Vector(dim), nullable=False),
        sa.Column(
            "metadata",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_document_chunks_source", "document_chunks", ["source"])
    if dim <= HNSW_MAX_DIM:
        # Fast nearest-neighbour search by cosine distance.
        op.execute(
            "CREATE INDEX ix_document_chunks_embedding_hnsw ON document_chunks "
            "USING hnsw (embedding vector_cosine_ops)"
        )

    op.create_table(
        "chat_logs",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("session_id", sa.String(64), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("ip_hash", sa.String(64), nullable=True),
    )
    op.create_index("ix_chat_logs_session_id", "chat_logs", ["session_id"])


def downgrade() -> None:
    op.drop_index("ix_chat_logs_session_id", table_name="chat_logs")
    op.drop_table("chat_logs")
    op.execute("DROP INDEX IF EXISTS ix_document_chunks_embedding_hnsw")
    op.drop_index("ix_document_chunks_source", table_name="document_chunks")
    op.drop_table("document_chunks")
    # The extension is left in place: other tables in the same database may use it.
