"""
ThreatMatrix AI — Flow Service
Business logic for network flow data queries and aggregation.
"""

from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.flow import NetworkFlow


# ── Interval Mapping ───────────────────────────────────────────────
INTERVAL_MAP = {
    "5m": timedelta(minutes=5),
    "15m": timedelta(minutes=15),
    "1h": timedelta(hours=1),
    "6h": timedelta(hours=6),
    "24h": timedelta(hours=24),
}

# ── Protocol Mapping ───────────────────────────────────────────────
PROTOCOL_MAP = {
    1: "ICMP",
    6: "TCP",
    17: "UDP",
}


async def get_flows(
    db: AsyncSession,
    page: int = 1,
    limit: int = 50,
    src_ip: str | None = None,
    dst_ip: str | None = None,
    protocol: int | None = None,
    is_anomaly: bool | None = None,
    min_score: float | None = None,
    time_range: str = "1h",
) -> dict[str, Any]:
    """
    List network flows with filtering and pagination.
    
    Returns paginated flow list with total count.
    """
    # Calculate time filter
    delta = INTERVAL_MAP.get(time_range, timedelta(hours=1))
    since = datetime.now(timezone.utc) - delta
    
    # Build query
    query = select(NetworkFlow).where(NetworkFlow.timestamp >= since)
    count_query = select(func.count()).select_from(NetworkFlow).where(
        NetworkFlow.timestamp >= since
    )
    
    # Apply filters
    if src_ip:
        query = query.where(NetworkFlow.src_ip == src_ip)
        count_query = count_query.where(NetworkFlow.src_ip == src_ip)
    
    if dst_ip:
        query = query.where(NetworkFlow.dst_ip == dst_ip)
        count_query = count_query.where(NetworkFlow.dst_ip == dst_ip)
    
    if protocol is not None:
        query = query.where(NetworkFlow.protocol == protocol)
        count_query = count_query.where(NetworkFlow.protocol == protocol)
    
    if is_anomaly is not None:
        query = query.where(NetworkFlow.is_anomaly == is_anomaly)
        count_query = count_query.where(NetworkFlow.is_anomaly == is_anomaly)
    
    if min_score is not None:
        query = query.where(NetworkFlow.anomaly_score >= min_score)
        count_query = count_query.where(NetworkFlow.anomaly_score >= min_score)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply pagination and ordering
    query = query.order_by(NetworkFlow.timestamp.desc())
    query = query.offset((page - 1) * limit).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    flows = result.scalars().all()
    
    return {
        "items": [
            {
                "id": str(flow.id),
                "timestamp": flow.timestamp.isoformat(),
                "src_ip": str(flow.src_ip),
                "dst_ip": str(flow.dst_ip),
                "src_port": flow.src_port,
                "dst_port": flow.dst_port,
                "protocol": flow.protocol,
                "duration": flow.duration,
                "total_bytes": flow.total_bytes,
                "total_packets": flow.total_packets,
                "src_bytes": flow.src_bytes,
                "dst_bytes": flow.dst_bytes,
                "anomaly_score": flow.anomaly_score,
                "is_anomaly": flow.is_anomaly,
                "ml_model": flow.ml_model,
                "label": flow.label,
                "source": flow.source,
                "created_at": flow.created_at.isoformat(),
            }
            for flow in flows
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }


async def get_flow_by_id(
    db: AsyncSession,
    flow_id: UUID,
) -> dict[str, Any] | None:
    """
    Get a single flow by ID.
    
    Returns flow details or None if not found.
    """
    query = select(NetworkFlow).where(NetworkFlow.id == flow_id)
    result = await db.execute(query)
    flow = result.scalar_one_or_none()
    
    if not flow:
        return None
    
    return {
        "id": str(flow.id),
        "timestamp": flow.timestamp.isoformat(),
        "src_ip": str(flow.src_ip),
        "dst_ip": str(flow.dst_ip),
        "src_port": flow.src_port,
        "dst_port": flow.dst_port,
        "protocol": flow.protocol,
        "duration": flow.duration,
        "total_bytes": flow.total_bytes,
        "total_packets": flow.total_packets,
        "src_bytes": flow.src_bytes,
        "dst_bytes": flow.dst_bytes,
        "features": flow.features,
        "anomaly_score": flow.anomaly_score,
        "is_anomaly": flow.is_anomaly,
        "ml_model": flow.ml_model,
        "label": flow.label,
        "source": flow.source,
        "created_at": flow.created_at.isoformat(),
    }


async def get_flow_stats(
    db: AsyncSession,
    interval: str = "1h",
) -> dict[str, Any]:
    """
    Get aggregated flow statistics over a time interval.
    
    Returns total flows, anomaly count, percentages, and distributions.
    """
    delta = INTERVAL_MAP.get(interval, timedelta(hours=1))
    since = datetime.now(timezone.utc) - delta
    
    # Basic stats query
    stats_query = select(
        func.count().label("total_flows"),
        func.count().filter(NetworkFlow.is_anomaly == True).label("anomaly_count"),
        func.coalesce(func.avg(NetworkFlow.anomaly_score), 0.0).label("avg_anomaly_score"),
        func.coalesce(func.sum(NetworkFlow.total_bytes), 0).label("total_bytes"),
        func.coalesce(func.sum(NetworkFlow.total_packets), 0).label("total_packets"),
    ).where(NetworkFlow.timestamp >= since)
    
    stats_result = await db.execute(stats_query)
    stats = stats_result.one()
    
    total_flows = stats.total_flows or 0
    anomaly_count = stats.anomaly_count or 0
    anomaly_percentage = (anomaly_count / total_flows * 100) if total_flows > 0 else 0.0
    
    # Protocol distribution
    protocol_query = select(
        NetworkFlow.protocol,
        func.count().label("count"),
    ).where(
        NetworkFlow.timestamp >= since
    ).group_by(
        NetworkFlow.protocol
    ).order_by(
        text("count DESC")
    )
    
    protocol_result = await db.execute(protocol_query)
    protocol_rows = protocol_result.all()
    
    protocol_distribution = {}
    for row in protocol_rows:
        name = PROTOCOL_MAP.get(row.protocol, f"Other({row.protocol})")
        protocol_distribution[name] = row.count
    
    # Top source IPs
    top_src_query = select(
        NetworkFlow.src_ip,
        func.count().label("flow_count"),
        func.coalesce(func.sum(NetworkFlow.total_bytes), 0).label("bytes"),
    ).where(
        NetworkFlow.timestamp >= since
    ).group_by(
        NetworkFlow.src_ip
    ).order_by(
        text("flow_count DESC")
    ).limit(10)
    
    top_src_result = await db.execute(top_src_query)
    top_src_rows = top_src_result.all()
    
    top_source_ips = [
        {"ip": str(row.src_ip), "flow_count": row.flow_count, "bytes": row.bytes}
        for row in top_src_rows
    ]
    
    # Top destination IPs
    top_dst_query = select(
        NetworkFlow.dst_ip,
        func.count().label("flow_count"),
        func.coalesce(func.sum(NetworkFlow.total_bytes), 0).label("bytes"),
    ).where(
        NetworkFlow.timestamp >= since
    ).group_by(
        NetworkFlow.dst_ip
    ).order_by(
        text("flow_count DESC")
    ).limit(10)
    
    top_dst_result = await db.execute(top_dst_query)
    top_dst_rows = top_dst_result.all()
    
    top_dest_ips = [
        {"ip": str(row.dst_ip), "flow_count": row.flow_count, "bytes": row.bytes}
        for row in top_dst_rows
    ]
    
    return {
        "interval": interval,
        "total_flows": total_flows,
        "anomaly_count": anomaly_count,
        "anomaly_percentage": round(anomaly_percentage, 2),
        "avg_anomaly_score": round(float(stats.avg_anomaly_score or 0), 4),
        "total_bytes": stats.total_bytes or 0,
        "total_packets": stats.total_packets or 0,
        "protocol_distribution": protocol_distribution,
        "top_source_ips": top_source_ips,
        "top_dest_ips": top_dest_ips,
    }


async def get_top_talkers(
    db: AsyncSession,
    limit: int = 10,
    time_range: str = "1h",
) -> dict[str, Any]:
    """
    Get top source IPs by traffic volume.
    
    Returns list of IPs with flow count and byte volume.
    """
    delta = INTERVAL_MAP.get(time_range, timedelta(hours=1))
    since = datetime.now(timezone.utc) - delta
    
    query = select(
        NetworkFlow.src_ip,
        func.count().label("flow_count"),
        func.coalesce(func.sum(NetworkFlow.total_bytes), 0).label("total_bytes"),
        func.coalesce(func.sum(NetworkFlow.total_packets), 0).label("total_packets"),
        func.count().filter(NetworkFlow.is_anomaly == True).label("anomaly_count"),
    ).where(
        NetworkFlow.timestamp >= since
    ).group_by(
        NetworkFlow.src_ip
    ).order_by(
        text("flow_count DESC")
    ).limit(limit)
    
    result = await db.execute(query)
    rows = result.all()
    
    talkers = [
        {
            "ip": str(row.src_ip),
            "flow_count": row.flow_count,
            "total_bytes": row.total_bytes,
            "total_packets": row.total_packets,
            "anomaly_count": row.anomaly_count,
        }
        for row in rows
    ]
    
    return {
        "top_talkers": talkers,
        "period": time_range,
        "total_talkers": len(talkers),
    }


async def get_protocol_distribution(
    db: AsyncSession,
    time_range: str = "1h",
) -> dict[str, Any]:
    """
    Get protocol distribution breakdown.
    
    Returns count and percentage for each protocol.
    """
    delta = INTERVAL_MAP.get(time_range, timedelta(hours=1))
    since = datetime.now(timezone.utc) - delta
    
    # Get total count
    total_query = select(func.count()).where(NetworkFlow.timestamp >= since)
    total_result = await db.execute(total_query)
    total = total_result.scalar() or 0
    
    # Get protocol counts
    query = select(
        NetworkFlow.protocol,
        func.count().label("count"),
    ).where(
        NetworkFlow.timestamp >= since
    ).group_by(
        NetworkFlow.protocol
    ).order_by(
        text("count DESC")
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    protocols = {}
    for row in rows:
        name = PROTOCOL_MAP.get(row.protocol, f"Other({row.protocol})")
        percentage = (row.count / total * 100) if total > 0 else 0.0
        protocols[name] = {
            "count": row.count,
            "percentage": round(percentage, 2),
        }
    
    return {
        "protocols": protocols,
        "total_flows": total,
        "period": time_range,
    }


async def search_flows(
    db: AsyncSession,
    src_ip: str | None = None,
    dst_ip: str | None = None,
    protocol: int | None = None,
    min_score: float | None = None,
    label: str | None = None,
    time_range: str = "1h",
    page: int = 1,
    limit: int = 50,
) -> dict[str, Any]:
    """
    Advanced flow search with multiple filters.
    
    Returns paginated results matching all specified criteria.
    """
    delta = INTERVAL_MAP.get(time_range, timedelta(hours=1))
    since = datetime.now(timezone.utc) - delta
    
    # Build query
    query = select(NetworkFlow).where(NetworkFlow.timestamp >= since)
    count_query = select(func.count()).select_from(NetworkFlow).where(
        NetworkFlow.timestamp >= since
    )
    
    if src_ip:
        query = query.where(NetworkFlow.src_ip == src_ip)
        count_query = count_query.where(NetworkFlow.src_ip == src_ip)
    
    if dst_ip:
        query = query.where(NetworkFlow.dst_ip == dst_ip)
        count_query = count_query.where(NetworkFlow.dst_ip == dst_ip)
    
    if protocol is not None:
        query = query.where(NetworkFlow.protocol == protocol)
        count_query = count_query.where(NetworkFlow.protocol == protocol)
    
    if min_score is not None:
        query = query.where(NetworkFlow.anomaly_score >= min_score)
        count_query = count_query.where(NetworkFlow.anomaly_score >= min_score)
    
    if label:
        query = query.where(NetworkFlow.label == label)
        count_query = count_query.where(NetworkFlow.label == label)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply pagination
    query = query.order_by(NetworkFlow.timestamp.desc())
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    flows = result.scalars().all()
    
    return {
        "items": [
            {
                "id": str(flow.id),
                "timestamp": flow.timestamp.isoformat(),
                "src_ip": str(flow.src_ip),
                "dst_ip": str(flow.dst_ip),
                "src_port": flow.src_port,
                "dst_port": flow.dst_port,
                "protocol": flow.protocol,
                "duration": flow.duration,
                "total_bytes": flow.total_bytes,
                "total_packets": flow.total_packets,
                "anomaly_score": flow.anomaly_score,
                "is_anomaly": flow.is_anomaly,
                "label": flow.label,
                "source": flow.source,
                "created_at": flow.created_at.isoformat(),
            }
            for flow in flows
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }
