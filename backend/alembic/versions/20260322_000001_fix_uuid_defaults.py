"""fix_uuid_defaults

Revision ID: 20260322_000001
Revises: 20260226_000000
Create Date: 2026-03-22 00:00:00.000000

Fix: Add server_default gen_random_uuid() to all UUID primary key columns
that were missing it. Raw SQL inserts fail without this because PostgreSQL
expects a non-null value for the id column.

Root cause: The initial migration defined UUID PKs without server_default.
The Python-side default=uuid4 only works for ORM inserts, not raw SQL.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '20260322_000001'
down_revision: Union[str, None] = '20260226_000000'
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

# Tables with UUID primary keys that need the fix
TABLES_WITH_UUID_PK = [
    'users',
    'network_flows',
    'alerts',
    'threat_intel_iocs',
    'ml_models',
    'capture_sessions',
    'pcap_uploads',
    'llm_conversations',
    'audit_log',
]


def upgrade() -> None:
    """Add gen_random_uuid() default to all UUID primary key columns."""
    # Ensure gen_random_uuid extension is available
    op.execute('CREATE EXTENSION IF NOT EXISTS pgcrypto')

    for table in TABLES_WITH_UUID_PK:
        op.alter_column(
            table,
            'id',
            server_default=sa.text('gen_random_uuid()'),
            existing_type=sa.dialects.postgresql.UUID(as_uuid=True),
        )


def downgrade() -> None:
    """Remove server_default from UUID primary key columns."""
    for table in TABLES_WITH_UUID_PK:
        op.alter_column(
            table,
            'id',
            server_default=None,
            existing_type=sa.dialects.postgresql.UUID(as_uuid=True),
        )
