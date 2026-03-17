"""
ThreatMatrix AI — ML Pydantic Schemas
Request/response schemas for ML model endpoints.
"""

from datetime import datetime
from uuid import UUID
from typing import Any

from pydantic import BaseModel, Field


class MLModelResponse(BaseModel):
    """Response schema for ML model data."""
    
    id: UUID
    name: str
    model_type: str
    version: str
    status: str
    dataset: str | None = None
    metrics: dict[str, Any] | None = None
    hyperparams: dict[str, Any] | None = None
    file_path: str | None = None
    training_time: float | None = None
    inference_time: float | None = None
    is_active: bool
    trained_at: datetime | None = None
    created_at: datetime


class MLModelListResponse(BaseModel):
    """Response schema for paginated ML model list."""
    
    items: list[MLModelResponse]
    total: int


class PredictionRequest(BaseModel):
    """Request schema for ML prediction."""
    
    features: dict[str, Any] = Field(description="40+ feature vector")


class PredictionResponse(BaseModel):
    """Response schema for ML prediction result."""
    
    flow_id: UUID | None = None
    anomaly_score: float = Field(ge=0.0, le=1.0)
    is_anomaly: bool
    label: str | None = None
    confidence: float = Field(ge=0.0, le=1.0)
    model_used: str
    ensemble_scores: dict[str, float] | None = None
