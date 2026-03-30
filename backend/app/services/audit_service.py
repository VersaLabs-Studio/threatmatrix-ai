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

from sqlalchemy import text

logger = logging.getLogger(__name__)

# Dev mode user UUID — doesn't exist in users table, so FK would fail
_DEV_USER_ID = "00000000-0000-0000-0000-000000000001"


async def _do_audit_insert(
    action: str,
    entity_type: str,
    entity_id: Optional[str],
    user_id: Optional[str],
    details: Optional[Dict[str, Any]],
    ip_address: Optional[str],
) -> None:
    """Perform the actual audit INSERT. Called as a BackgroundTask."""
    # Skip FK-violating dev user UUID — pass NULL instead
    if user_id == _DEV_USER_ID:
        user_id = None

    try:
        from app.database import async_session

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
