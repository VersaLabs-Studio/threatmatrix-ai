"""
ThreatMatrix AI — Network Flow Endpoints
Flow data queries, statistics, and aggregation.
"""

from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_active_user
from app.services import flow_service

router = APIRouter()


@router.get("/")
async def list_flows(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    time_range: str = Query("1h", pattern="^(5m|15m|1h|6h|24h)$"),
    src_ip: Optional[str] = None,
    dst_ip: Optional[str] = None,
    protocol: Optional[int] = None,
    is_anomaly: Optional[bool] = None,
    min_score: Optional[float] = Query(None, ge=0.0, le=1.0),
    db: AsyncSession = Depends(get_db),
    user: Any = Depends(get_current_active_user),
) -> dict[str, Any]:
    """List network flows with filtering and pagination."""
    return await flow_service.get_flows(
        db=db,
        page=page,
        limit=limit,
        src_ip=src_ip,
        dst_ip=dst_ip,
        protocol=protocol,
        is_anomaly=is_anomaly,
        min_score=min_score,
        time_range=time_range,
    )


@router.get("/stats")
async def flow_statistics(
    interval: str = Query("1h", pattern="^(5m|15m|1h|6h|24h)$"),
    db: AsyncSession = Depends(get_db),
    user: Any = Depends(get_current_active_user),
) -> dict[str, Any]:
    """Get flow statistics over time interval."""
    return await flow_service.get_flow_stats(db=db, interval=interval)


@router.get("/top-talkers")
async def top_talkers(
    limit: int = Query(10, ge=1, le=50),
    time_range: str = Query("1h", pattern="^(5m|15m|1h|6h|24h)$"),
    db: AsyncSession = Depends(get_db),
    user: Any = Depends(get_current_active_user),
) -> dict[str, Any]:
    """Get top source IPs by traffic volume."""
    return await flow_service.get_top_talkers(db=db, limit=limit, time_range=time_range)


@router.get("/protocols")
async def protocol_distribution(
    time_range: str = Query("1h", pattern="^(5m|15m|1h|6h|24h)$"),
    db: AsyncSession = Depends(get_db),
    user: Any = Depends(get_current_active_user),
) -> dict[str, Any]:
    """Get protocol distribution breakdown."""
    return await flow_service.get_protocol_distribution(db=db, time_range=time_range)


@router.get("/{flow_id}")
async def get_flow(
    flow_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: Any = Depends(get_current_active_user),
) -> dict[str, Any]:
    """Get a single flow by ID."""
    flow = await flow_service.get_flow_by_id(db=db, flow_id=flow_id)
    if not flow:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Flow not found")
    return flow


@router.post("/search")
async def search_flows(
    src_ip: Optional[str] = None,
    dst_ip: Optional[str] = None,
    protocol: Optional[int] = None,
    min_score: Optional[float] = Query(None, ge=0.0, le=1.0),
    label: Optional[str] = None,
    time_range: str = Query("1h", pattern="^(5m|15m|1h|6h|24h)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    user: Any = Depends(get_current_active_user),
) -> dict[str, Any]:
    """Advanced flow search with multiple filters."""
    return await flow_service.search_flows(
        db=db,
        src_ip=src_ip,
        dst_ip=dst_ip,
        protocol=protocol,
        min_score=min_score,
        label=label,
        time_range=time_range,
        page=page,
        limit=limit,
    )
