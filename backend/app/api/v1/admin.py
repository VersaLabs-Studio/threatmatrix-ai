"""
ThreatMatrix AI — Admin API Endpoints

Per MASTER_DOC_PART3 §11 (Administration Module):
  - Audit Log: GET /admin/audit-log (paginated, filterable)
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Query
from sqlalchemy import text

from app.database import async_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Administration"])


@router.get("/audit-log")
async def get_audit_log(
    limit: int = Query(50, ge=1, le=200, description="Max entries to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    action: Optional[str] = Query(None, description="Filter by action type"),
) -> Dict[str, Any]:
    """
    Get system audit log entries.

    Per MASTER_DOC_PART3 §11.1.
    Returns paginated audit log entries, optionally filtered by action type.

    Query params:
        limit: Number of entries (1-200, default 50).
        offset: Skip N entries (default 0).
        action: Filter by action string (e.g., 'login', 'create_alert').
    """
    async with async_session() as session:
        # Build filtered query
        where_clause = ""
        params: Dict[str, Any] = {"limit": limit, "offset": offset}

        if action:
            where_clause = "WHERE action = :action"
            params["action"] = action

        query = f"""
            SELECT id, user_id, action, entity_type, entity_id,
                   details, ip_address, created_at
            FROM audit_log
            {where_clause}
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """

        result = await session.execute(text(query), params)
        rows = result.fetchall()

        # Total count (with same filter)
        count_query = f"SELECT COUNT(*) FROM audit_log {where_clause}"
        count_params = {"action": action} if action else {}
        count_result = await session.execute(text(count_query), count_params)
        total = count_result.scalar() or 0

    entries = []
    for r in rows:
        entries.append(
            {
                "id": str(r[0]),
                "user_id": str(r[1]) if r[1] else None,
                "action": r[2],
                "entity_type": r[3],
                "entity_id": str(r[4]) if r[4] else None,
                "details": r[5],
                "ip_address": str(r[6]) if r[6] else None,
                "created_at": str(r[7]) if r[7] else None,
            }
        )

    return {
        "entries": entries,
        "total": total,
        "limit": limit,
        "offset": offset,
    }
