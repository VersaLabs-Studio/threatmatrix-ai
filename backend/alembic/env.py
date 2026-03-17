"""
ThreatMatrix AI — Alembic Migration Environment
Async SQLAlchemy migration environment for PostgreSQL.
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

# ── Import app configuration and models ──────────────────────────
# Add the backend directory to the path so we can import from app
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import get_settings
from app.database import Base

# Import all models so Base.metadata is populated for autogenerate
# This import is REQUIRED for alembic --autogenerate to detect tables
from app.models import *  # noqa: F401, F403

# ── Alembic Config object ────────────────────────────────────────
config = context.config

# ── Override sqlalchemy.url from app settings ────────────────────
settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# ── Setup logging from alembic.ini ───────────────────────────────
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ── Target metadata for autogenerate ─────────────────────────────
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well. By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    """Run migrations with the given connection."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
        # Include schemas in the migration
        include_schemas=True,
        # Render batch operations for SQLite compatibility
        render_as_batch=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations():
    """
    Run migrations in 'online' mode with async engine.

    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    connectable = create_async_engine(
        config.get_main_option("sqlalchemy.url"),
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode.

    This function handles the async migration execution
    by running the async migration function in an event loop.
    """
    asyncio.run(run_async_migrations())


# ── Entry point ──────────────────────────────────────────────────
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
