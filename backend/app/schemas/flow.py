"""
ThreatMatrix AI — Flow Pydantic Schemas
Request/response schemas for network flow endpoints.
"""

from datetime import datetime
from uuid import UUID
from typing import Any

from pydantic import BaseModel


class FlowResponse(BaseModel):
    """Response schema for network flow data."""
    
    id: UUID
    timestamp: datetime
    src_ip: str
    dst_ip: str
    src_port: int | None = None
    dst_port: int | None = None
    protocol: int
    duration: float | None = None
    total_bytes: int | None = None
    total_packets: int | None = None
    src_bytes: int | None = None
    dst_bytes: int | None = None
    features: dict[str, Any]
    anomaly_score: float | None = None
    is_anomaly: bool
    ml_model: str | None = None
    label: str | None = None
    source: str
    created_at: datetime


class FlowListResponse(BaseModel):
    """Response schema for paginated flow list."""
    
    items: list[FlowResponse]
    total: int
    page: int
    limit: int


class FlowStatsResponse(BaseModel):
    """Response schema for flow statistics."""
    
    total_flows: int
    anomaly_count: int
    anomaly_percentage: float
    avg_anomaly_score: float | None = None
    protocol_distribution: dict[str, int]
    top_source_ips: list[dict[str, Any]]
    top_dest_ips: list[dict[str, Any]]
