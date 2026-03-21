"""
ThreatMatrix AI — Alert Endpoints
Alert management, lifecycle, and statistics.
"""

from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_active_user
from app.services import alert_service

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
    """Get detailed alert information."""
    alert = await alert_service.get_alert_by_id(db=db, alert_id=alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.patch("/{alert_id}/status")
async def update_alert_status(
    alert_id: str = Path(...),
    body: StatusUpdateRequest = ...,
    db: AsyncSession = Depends(get_db),
    user: Any = Depends(get_current_active_user),
) -> dict[str, Any]:
    """Update alert lifecycle status."""
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
    
    return result


@router.patch("/{alert_id}/assign")
async def assign_alert(
    alert_id: str = Path(...),
    body: AssignRequest = ...,
    db: AsyncSession = Depends(get_db),
    user: Any = Depends(get_current_active_user),
) -> dict[str, Any]:
    """Assign alert to an analyst."""
    result = await alert_service.assign_alert(
        db=db,
        alert_id=alert_id,
        assignee_id=body.assignee_id,
    )
    
    if result is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return result
