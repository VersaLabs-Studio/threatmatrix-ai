"""
ThreatMatrix AI — API v1 Router
Aggregates all v1 route modules into a single router.
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.system import router as system_router
from app.api.v1.flows import router as flows_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.websocket import router as websocket_router
from app.api.v1.capture import router as capture_router

router = APIRouter()

# ── Mount sub-routers ────────────────────────────────────────
router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
router.include_router(system_router, prefix="/system", tags=["System"])
router.include_router(flows_router, prefix="/flows", tags=["Network Flows"])
router.include_router(alerts_router, prefix="/alerts", tags=["Alerts"])
router.include_router(websocket_router, tags=["WebSocket"])
router.include_router(capture_router, prefix="/capture", tags=["Capture"])
