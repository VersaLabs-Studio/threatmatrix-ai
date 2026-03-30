"""
ThreatMatrix AI — Audit Service

Per MASTER_DOC_PART3 §11.1:
  Records all significant system events for compliance and forensics.

Events to track:
  - User login/logout
  - Alert status changes
  - Model retrain triggers
  - Report generation
  - IOC sync operations
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

import psycopg2

logger = logging.getLogger(__name__)

# Dev mode user UUID — doesn't exist in users table, so FK would fail
_DEV_USER_ID = "00000000-0000-0000-0000-000000000001"

# Direct connection URL for synchronous audit writes
_AUDIT_DB_URL = None


def _get_audit_db_url() -> Optional[str]:
    """Get a synchronous database URL for audit writes."""
    global _AUDIT_DB_URL
    if _AUDIT_DB_URL is None:
        try:
            from app.config import get_settings
            settings = get_settings()
            # Convert async URL to sync: postgresql+asyncpg:// → postgresql://
            url = settings.DATABASE_URL.replace("+asyncpg", "")
            _AUDIT_DB_URL = url
        except Exception:
            pass
    return _AUDIT_DB_URL


def log_audit_event(
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    user_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
) -> None:
    """
    Record an audit log entry synchronously.

    Uses a direct psycopg2 connection (bypassing async SQLAlchemy) for
    guaranteed persistence. Failure is logged but never raises.

    Args:
        action: Action performed (e.g., "login", "retrain", "alert_status_change").
        entity_type: Type of entity affected (e.g., "user", "model", "alert").
        entity_id: ID of the affected entity.
        user_id: ID of the user who performed the action.
        details: Additional context stored as JSONB.
        ip_address: Client IP address.
    """
    # Skip FK-violating dev user UUID — pass NULL instead
    if user_id == _DEV_USER_ID:
        user_id = None

    db_url = _get_audit_db_url()
    if not db_url:
        logger.warning("[AUDIT] No DB URL available — skipping %s", action)
        return

    conn = None
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO audit_log
                (id, user_id, action, entity_type, entity_id,
                 details, ip_address, created_at)
            VALUES
                (%s, %s, %s, %s, %s, %s::jsonb, %s::inet, %s)
            """,
            (
                str(uuid4()),
                user_id,
                action,
                entity_type,
                entity_id,
                json.dumps(details) if details else None,
                ip_address,
                datetime.now(timezone.utc),
            ),
        )
        conn.commit()
        cur.close()
    except Exception as e:
        logger.error("[AUDIT] Failed to log event: %s — %s", action, e)
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()
