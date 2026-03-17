"""
ThreatMatrix AI — Common Pydantic Schemas
Shared request/response schemas used across all modules.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class PaginationParams(BaseModel):
    """Query parameters for pagination."""
    
    page: int = Field(default=1, ge=1, description="Page number")
    limit: int = Field(default=50, ge=1, le=100, description="Items per page")


class PaginatedResponse(BaseModel):
    """Paginated response wrapper."""
    
    items: list
    total: int
    page: int
    limit: int
    pages: int


class TimestampMixin(BaseModel):
    """Mixin for created_at/updated_at fields."""
    
    created_at: datetime
    updated_at: datetime | None = None


class ErrorResponse(BaseModel):
    """Standard error response."""
    
    detail: str
    status_code: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
