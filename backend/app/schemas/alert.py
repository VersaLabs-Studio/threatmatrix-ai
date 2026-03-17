"""
ThreatMatrix AI — Alert Pydantic Schemas
Request/response schemas for alert endpoints.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AlertCreate(BaseModel):
    """Request schema for creating an alert."""
    
    severity: str = Field(pattern="^(critical|high|medium|low|info)$")
    title: str = Field(min_length=1, max_length=500)
    description: str | None = None
    category: str | None = None
    source_ip: str | None = None
    dest_ip: str | None = None
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)


class AlertUpdate(BaseModel):
    """Request schema for updating an alert."""
    
    status: str | None = Field(default=None, pattern="^(open|acknowledged|investigating|resolved|false_positive)$")
    assigned_to: UUID | None = None
    resolution_note: str | None = None


class AlertResponse(BaseModel):
    """Response schema for alert data."""
    
    id: UUID
    alert_id: str
    severity: str
    title: str
    description: str | None = None
    category: str | None = None
    source_ip: str | None = None
    dest_ip: str | None = None
    confidence: float | None = None
    status: str
    assigned_to: UUID | None = None
    flow_ids: list[UUID] | None = None
    ml_model: str | None = None
    ai_narrative: str | None = None
    ai_playbook: str | None = None
    resolved_at: datetime | None = None
    resolved_by: UUID | None = None
    resolution_note: str | None = None
    created_at: datetime
    updated_at: datetime | None = None


class AlertListResponse(BaseModel):
    """Response schema for paginated alert list."""
    
    items: list[AlertResponse]
    total: int
    page: int
    limit: int


class AlertStatsResponse(BaseModel):
    """Response schema for alert statistics."""
    
    total_alerts: int
    open_count: int
    acknowledged_count: int
    investigating_count: int
    resolved_count: int
    false_positive_count: int
    severity_distribution: dict[str, int]
    category_distribution: dict[str, int]
