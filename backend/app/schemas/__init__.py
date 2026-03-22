"""
ThreatMatrix AI — Pydantic Schemas
All request/response schemas for API validation.
"""

from app.schemas.common import (
    PaginationParams,
    PaginatedResponse,
    TimestampMixin,
    ErrorResponse,
)
from app.schemas.auth import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    TokenRefresh,
)
from app.schemas.flow import (
    FlowResponse,
    FlowListResponse,
    FlowStatsResponse,
)
from app.schemas.alert import (
    AlertCreate,
    AlertUpdate,
    AlertResponse,
    AlertListResponse,
    AlertStatsResponse,
)
from app.schemas.intel import (
    IOCResponse,
    IOCListResponse,
    IPReputationResponse,
)
from app.schemas.ml import (
    MLModelResponse,
    MLModelListResponse,
    PredictionRequest,
    PredictionResponse,
)
from app.schemas.capture import (
    CaptureStatus,
    CaptureStartRequest,
    CaptureStartResponse,
    CaptureStopResponse,
)

__all__ = [
    # Common
    "PaginationParams",
    "PaginatedResponse",
    "TimestampMixin",
    "ErrorResponse",
    # Auth
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "TokenResponse",
    "TokenRefresh",
    # Flows
    "FlowResponse",
    "FlowListResponse",
    "FlowStatsResponse",
    # Alerts
    "AlertCreate",
    "AlertUpdate",
    "AlertResponse",
    "AlertListResponse",
    "AlertStatsResponse",
    # Intel
    "IOCResponse",
    "IOCListResponse",
    "IPReputationResponse",
    # ML
    "MLModelResponse",
    "MLModelListResponse",
    "PredictionRequest",
    "PredictionResponse",
    # Capture
    "CaptureStatus",
    "CaptureStartRequest",
    "CaptureStartResponse",
    "CaptureStopResponse",
]
