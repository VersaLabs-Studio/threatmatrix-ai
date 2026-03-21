"""
ThreatMatrix AI — Alert Service
Business logic for alert management, lifecycle, and statistics.
"""

from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert
from app.models.user import User


# ── Alert ID Counter ───────────────────────────────────────────────
_alert_counter = 0


def _generate_alert_id() -> str:
    """Generate human-readable alert ID (e.g., TM-ALERT-00001)."""
    global _alert_counter
    _alert_counter += 1
    return f"TM-ALERT-{_alert_counter:05d}"


# ── Severity Order (for sorting) ───────────────────────────────────
SEVERITY_ORDER = {
    "critical": 0,
    "high": 1,
    "medium": 2,
    "low": 3,
    "info": 4,
}

# ── Valid Status Transitions ───────────────────────────────────────
VALID_TRANSITIONS = {
    "open": ["acknowledged"],
    "acknowledged": ["investigating"],
    "investigating": ["resolved", "false_positive"],
    "resolved": [],
    "false_positive": [],
}

# ── Role Permissions for Status Transitions ────────────────────────
STATUS_PERMISSIONS = {
    "acknowledged": ["admin", "soc_manager", "analyst"],
    "investigating": ["admin", "soc_manager", "analyst"],
    "resolved": ["admin", "soc_manager"],
    "false_positive": ["admin", "soc_manager", "analyst"],
}


async def get_alerts(
    db: AsyncSession,
    page: int = 1,
    limit: int = 50,
    severity: str | None = None,
    status: str | None = None,
    category: str | None = None,
    time_range: str = "24h",
) -> dict[str, Any]:
    """
    List alerts with filtering and pagination.
    
    Returns paginated alert list with total count.
    """
    # Calculate time filter
    delta_map = {
        "1h": timedelta(hours=1),
        "6h": timedelta(hours=6),
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
    }
    delta = delta_map.get(time_range, timedelta(hours=24))
    since = datetime.now(timezone.utc) - delta
    
    # Build query
    query = select(Alert).where(Alert.created_at >= since)
    count_query = select(func.count()).select_from(Alert).where(
        Alert.created_at >= since
    )
    
    # Apply filters
    if severity:
        query = query.where(Alert.severity == severity)
        count_query = count_query.where(Alert.severity == severity)
    
    if status:
        query = query.where(Alert.status == status)
        count_query = count_query.where(Alert.status == status)
    
    if category:
        query = query.where(Alert.category == category)
        count_query = count_query.where(Alert.category == category)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply pagination and ordering (severity first, then timestamp)
    query = query.order_by(
        text("CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END"),
        Alert.created_at.desc()
    )
    query = query.offset((page - 1) * limit).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    alerts = result.scalars().all()
    
    return {
        "items": [
            {
                "id": str(alert.id),
                "alert_id": alert.alert_id,
                "severity": alert.severity,
                "title": alert.title,
                "description": alert.description,
                "category": alert.category,
                "source_ip": str(alert.source_ip) if alert.source_ip else None,
                "dest_ip": str(alert.dest_ip) if alert.dest_ip else None,
                "confidence": alert.confidence,
                "status": alert.status,
                "assigned_to": str(alert.assigned_to) if alert.assigned_to else None,
                "ml_model": alert.ml_model,
                "ai_narrative": alert.ai_narrative,
                "created_at": alert.created_at.isoformat(),
                "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None,
            }
            for alert in alerts
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }


async def get_alert_by_id(
    db: AsyncSession,
    alert_id: str,
) -> dict[str, Any] | None:
    """
    Get a single alert by human-readable alert_id.
    
    Returns alert details or None if not found.
    """
    query = select(Alert).where(Alert.alert_id == alert_id)
    result = await db.execute(query)
    alert = result.scalar_one_or_none()
    
    if not alert:
        return None
    
    return {
        "id": str(alert.id),
        "alert_id": alert.alert_id,
        "severity": alert.severity,
        "title": alert.title,
        "description": alert.description,
        "category": alert.category,
        "source_ip": str(alert.source_ip) if alert.source_ip else None,
        "dest_ip": str(alert.dest_ip) if alert.dest_ip else None,
        "confidence": alert.confidence,
        "status": alert.status,
        "assigned_to": str(alert.assigned_to) if alert.assigned_to else None,
        "flow_ids": [str(fid) for fid in alert.flow_ids] if alert.flow_ids else [],
        "ml_model": alert.ml_model,
        "ai_narrative": alert.ai_narrative,
        "ai_playbook": alert.ai_playbook,
        "created_at": alert.created_at.isoformat(),
        "updated_at": alert.updated_at.isoformat() if alert.updated_at else None,
        "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None,
        "resolved_by": str(alert.resolved_by) if alert.resolved_by else None,
        "resolution_note": alert.resolution_note,
    }


async def get_alert_stats(
    db: AsyncSession,
    time_range: str = "24h",
) -> dict[str, Any]:
    """
    Get alert statistics by severity and status.
    
    Returns counts for each severity and status level.
    """
    delta_map = {
        "1h": timedelta(hours=1),
        "6h": timedelta(hours=6),
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
    }
    delta = delta_map.get(time_range, timedelta(hours=24))
    since = datetime.now(timezone.utc) - delta
    
    # Total alerts in time range
    total_query = select(func.count()).where(Alert.created_at >= since)
    total_result = await db.execute(total_query)
    total = total_result.scalar() or 0
    
    # By severity
    severity_query = select(
        Alert.severity,
        func.count().label("count"),
    ).where(
        Alert.created_at >= since
    ).group_by(
        Alert.severity
    )
    
    severity_result = await db.execute(severity_query)
    severity_rows = severity_result.all()
    
    by_severity = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for row in severity_rows:
        if row.severity in by_severity:
            by_severity[row.severity] = row.count
    
    # By status
    status_query = select(
        Alert.status,
        func.count().label("count"),
    ).where(
        Alert.created_at >= since
    ).group_by(
        Alert.status
    )
    
    status_result = await db.execute(status_query)
    status_rows = status_result.all()
    
    by_status = {"open": 0, "acknowledged": 0, "investigating": 0, "resolved": 0, "false_positive": 0}
    for row in status_rows:
        if row.status in by_status:
            by_status[row.status] = row.count
    
    # By category
    category_query = select(
        Alert.category,
        func.count().label("count"),
    ).where(
        Alert.created_at >= since,
        Alert.category.isnot(None)
    ).group_by(
        Alert.category
    ).order_by(
        text("count DESC")
    ).limit(10)
    
    category_result = await db.execute(category_query)
    category_rows = category_result.all()
    
    by_category = {row.category: row.count for row in category_rows}
    
    return {
        "time_range": time_range,
        "total": total,
        "by_severity": by_severity,
        "by_status": by_status,
        "by_category": by_category,
    }


async def update_alert_status(
    db: AsyncSession,
    alert_id: str,
    new_status: str,
    user_id: UUID,
    user_role: str,
    resolution_note: str | None = None,
) -> dict[str, Any] | None:
    """
    Update alert lifecycle status.
    
    Validates status transition and user permissions.
    """
    # Get alert
    query = select(Alert).where(Alert.alert_id == alert_id)
    result = await db.execute(query)
    alert = result.scalar_one_or_none()
    
    if not alert:
        return None
    
    # Validate status transition
    valid_next = VALID_TRANSITIONS.get(alert.status, [])
    if new_status not in valid_next:
        return {
            "error": f"Invalid transition: {alert.status} -> {new_status}",
            "valid_transitions": valid_next,
        }
    
    # Validate user permission
    allowed_roles = STATUS_PERMISSIONS.get(new_status, [])
    if user_role not in allowed_roles:
        return {
            "error": f"Role '{user_role}' not permitted to set status to '{new_status}'",
            "allowed_roles": allowed_roles,
        }
    
    # Update alert
    update_data = {
        "status": new_status,
        "updated_at": datetime.now(timezone.utc),
    }
    
    if new_status == "resolved" or new_status == "false_positive":
        update_data["resolved_at"] = datetime.now(timezone.utc)
        update_data["resolved_by"] = user_id
        if resolution_note:
            update_data["resolution_note"] = resolution_note
    
    stmt = update(Alert).where(Alert.alert_id == alert_id).values(**update_data)
    await db.execute(stmt)
    await db.commit()
    
    # Refresh alert
    await db.refresh(alert)
    
    return {
        "alert_id": alert.alert_id,
        "previous_status": alert.status,
        "new_status": new_status,
        "updated_at": alert.updated_at.isoformat(),
    }


async def assign_alert(
    db: AsyncSession,
    alert_id: str,
    assignee_id: UUID,
) -> dict[str, Any] | None:
    """
    Assign alert to an analyst.
    """
    # Get alert
    query = select(Alert).where(Alert.alert_id == alert_id)
    result = await db.execute(query)
    alert = result.scalar_one_or_none()
    
    if not alert:
        return None
    
    # Update assignment
    stmt = update(Alert).where(Alert.alert_id == alert_id).values(
        assigned_to=assignee_id,
        updated_at=datetime.now(timezone.utc),
    )
    await db.execute(stmt)
    await db.commit()
    
    return {
        "alert_id": alert.alert_id,
        "assigned_to": str(assignee_id),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


async def create_alert(
    db: AsyncSession,
    severity: str,
    title: str,
    description: str | None = None,
    category: str | None = None,
    source_ip: str | None = None,
    dest_ip: str | None = None,
    confidence: float | None = None,
    ml_model: str | None = None,
    flow_ids: list[UUID] | None = None,
) -> dict[str, Any]:
    """
    Create a new alert (typically from ML Worker).
    
    Returns the created alert.
    """
    alert = Alert(
        id=uuid4(),
        alert_id=_generate_alert_id(),
        severity=severity,
        title=title,
        description=description,
        category=category,
        source_ip=source_ip,
        dest_ip=dest_ip,
        confidence=confidence,
        status="open",
        ml_model=ml_model,
        flow_ids=flow_ids,
    )
    
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    
    return {
        "id": str(alert.id),
        "alert_id": alert.alert_id,
        "severity": alert.severity,
        "title": alert.title,
        "status": alert.status,
        "created_at": alert.created_at.isoformat(),
    }
