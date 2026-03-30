"""
ThreatMatrix AI — Alert Endpoints
Alert management, lifecycle, and statistics.
"""

import logging
from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Path
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_active_user, require_role
from app.models.user import User
from app.services import alert_service
from app.services.audit_service import _do_audit_insert

logger = logging.getLogger(__name__)
router = APIRouter()


class StatusUpdateRequest(BaseModel):
    """Request schema for status update."""
    new_status: str
    resolution_note: Optional[str] = None


class AssignRequest(BaseModel):
    """Request schema for alert assignment."""
    assignee_id: UUID


@router.get("/")
async def list_alerts(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    time_range: str = Query("24h", pattern="^(1h|6h|24h|7d)$"),
    severity: Optional[str] = Query(None, pattern="^(critical|high|medium|low|info)$"),
    status: Optional[str] = Query(None, pattern="^(open|acknowledged|investigating|resolved|false_positive)$"),
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: Any = Depends(get_current_active_user),
) -> dict[str, Any]:
    """List alerts with severity and status filtering."""
    return await alert_service.get_alerts(
        db=db,
        page=page,
        limit=limit,
        severity=severity,
        status=status,
        category=category,
        time_range=time_range,
    )


@router.get("/stats")
async def alert_statistics(
    time_range: str = Query("24h", pattern="^(1h|6h|24h|7d)$"),
    db: AsyncSession = Depends(get_db),
    user: Any = Depends(get_current_active_user),
) -> dict[str, Any]:
    """Get alert counts by severity and status."""
    return await alert_service.get_alert_stats(db=db, time_range=time_range)


@router.get("/{alert_id}")
async def get_alert(
    alert_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
    user: Any = Depends(get_current_active_user),
) -> dict[str, Any]:
    """
    Get detailed alert information with IOC enrichment.
    Per MASTER_DOC_PART4 §11.3: alert responses include IOC correlation data.
    """
    alert = await alert_service.get_alert_by_id(db=db, alert_id=alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    # IOC Enrichment — correlate alert IPs against IOC database
    # Per §11.3: IP match → escalate, domain → C2/phishing, hash → malware
    ioc_enrichment: dict[str, Any] = {"has_match": False}
    try:
        from app.services.ioc_correlator import IOCCorrelator

        correlator = IOCCorrelator()
        ioc_result = await correlator.correlate_flow(
            {
                "source_ip": alert.get("source_ip"),
                "dest_ip": alert.get("dest_ip"),
            }
        )
        if ioc_result.get("has_ioc_match"):
            ioc_enrichment = {
                "has_match": True,
                "src_match": ioc_result.get("src_match"),
                "dst_match": ioc_result.get("dst_match"),
                "domain_match": ioc_result.get("domain_match"),
                "flags": ioc_result.get("flags", []),
                "escalation": ioc_result.get("escalation_severity"),
            }
        else:
            ioc_enrichment = {"has_match": False}
    except Exception as e:
        logger.error("[Alerts] IOC enrichment failed for %s: %s", alert_id, e)
        ioc_enrichment = {"has_match": False, "error": str(e)}

    alert["ioc_enrichment"] = ioc_enrichment
    return alert


@router.patch("/{alert_id}/status")
async def update_alert_status(
    alert_id: str = Path(...),
    body: StatusUpdateRequest = ...,
    background_tasks: BackgroundTasks = ...,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(["admin", "soc_manager", "analyst"])),
) -> dict[str, Any]:
    """Update alert lifecycle status. RBAC: admin, soc_manager, analyst."""
    result = await alert_service.update_alert_status(
        db=db,
        alert_id=alert_id,
        new_status=body.new_status,
        user_id=user.id,
        user_role=user.role,
        resolution_note=body.resolution_note,
    )

    if result is None:
        raise HTTPException(status_code=404, detail="Alert not found")

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    # Audit log (background task)
    background_tasks.add_task(
        _do_audit_insert,
        action="alert_status_change",
        entity_type="alert",
        entity_id=alert_id,
        user_id=str(user.id),
        details={"new_status": body.new_status, "resolution_note": body.resolution_note},
        ip_address=None,
    )

    return result


@router.patch("/{alert_id}/assign")
async def assign_alert(
    alert_id: str = Path(...),
    body: AssignRequest = ...,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(["admin", "soc_manager"])),
) -> dict[str, Any]:
    """Assign alert to an analyst. RBAC: admin, soc_manager."""
    """Assign alert to an analyst."""
    result = await alert_service.assign_alert(
        db=db,
        alert_id=alert_id,
        assignee_id=body.assignee_id,
    )
    
    if result is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return result
