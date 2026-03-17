"""
ThreatMatrix AI — Threat Intelligence Pydantic Schemas
Request/response schemas for threat intelligence endpoints.
"""

from datetime import datetime
from uuid import UUID
from typing import Any

from pydantic import BaseModel


class IOCResponse(BaseModel):
    """Response schema for threat intelligence IOC."""
    
    id: UUID
    ioc_type: str
    ioc_value: str
    threat_type: str | None = None
    severity: str | None = None
    source: str
    source_ref: str | None = None
    first_seen: datetime | None = None
    last_seen: datetime | None = None
    confidence: float | None = None
    tags: list[str] | None = None
    raw_data: dict[str, Any] | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime | None = None


class IOCListResponse(BaseModel):
    """Response schema for paginated IOC list."""
    
    items: list[IOCResponse]
    total: int
    page: int
    limit: int


class IPReputationResponse(BaseModel):
    """Response schema for IP reputation lookup."""
    
    ip: str
    is_malicious: bool
    confidence: float
    threat_types: list[str]
    sources: list[str]
    first_seen: datetime | None = None
    last_seen: datetime | None = None
    related_iocs: list[IOCResponse] | None = None
