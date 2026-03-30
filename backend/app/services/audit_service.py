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

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

from sqlalchemy import text

from app.database import async_session

logger = logging.getLogger(__name__)


async def log_audit_event(
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    user_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
) -> None:
    """
    Record an audit log entry.

    Fire-and-forget — audit failures are logged but never raise exceptions,
    so they cannot break the primary action.

    Args:
        action: Action performed (e.g., "login", "retrain", "alert_status_change").
        entity_type: Type of entity affected (e.g., "user", "model", "alert").
        entity_id: ID of the affected entity.
        user_id: ID of the user who performed the action.
        details: Additional context stored as JSONB.
        ip_address: Client IP address.
    """
    try:
        async with async_session() as session:
            await session.execute(
                text("""
                    INSERT INTO audit_log
                        (id, user_id, action, entity_type, entity_id,
                         details, ip_address, created_at)
                    VALUES
                        (:id, :user_id, :action, :entity_type, :entity_id,
                         :details::jsonb, :ip_address::inet, :now)
                """),
                {
                    "id": str(uuid4()),
                    "user_id": user_id,
                    "action": action,
                    "entity_type": entity_type,
                    "entity_id": entity_id,
                    "details": json.dumps(details) if details else None,
                    "ip_address": ip_address,
                    "now": datetime.now(timezone.utc),
                },
            )
            await session.commit()
    except Exception as e:
        logger.error("[AUDIT] Failed to log event: %s — %s", action, e)


def log_audit_event_sync(
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    user_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
) -> None:
    """
    Schedule an audit log entry asynchronously (fire-and-forget).

    Use this from synchronous endpoint code to avoid blocking the response.

    Args:
        action: Action performed.
        entity_type: Type of entity affected.
        entity_id: ID of the affected entity.
        user_id: ID of the user who performed the action.
        details: Additional context as dict.
        ip_address: Client IP address.
    """
    asyncio.create_task(
        log_audit_event(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            user_id=user_id,
            details=details,
            ip_address=ip_address,
        )
    )
