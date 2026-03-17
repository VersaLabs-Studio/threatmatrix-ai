"""
ThreatMatrix AI — System Endpoints
Health check, system status, and configuration.
"""

from fastapi import APIRouter, Request
from datetime import datetime, timezone

from app.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/health")
async def health_check(request: Request):
    """System health check endpoint with Redis status."""
    
    # Check Redis health
    redis_status = "unavailable"
    redis_latency = None
    redis_manager = getattr(request.app.state, 'redis_manager', None)
    
    if redis_manager:
        try:
            redis_health = await redis_manager.health_check()
            redis_status = redis_health.get("status", "unknown")
            redis_latency = redis_health.get("latency_ms")
        except Exception:
            redis_status = "error"
    
    # Determine overall status
    overall_status = "operational"
    if redis_status in ["unhealthy", "error"]:
        overall_status = "degraded"
    
    return {
        "status": overall_status,
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "components": {
            "api": "healthy",
            "database": "pending",     # TODO: actual DB ping
            "redis": {
                "status": redis_status,
                "latency_ms": redis_latency,
            },
            "capture_engine": "idle",
            "ml_worker": "idle",
        },
    }


@router.get("/info")
async def system_info():
    """System information and configuration (non-sensitive)."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "api_prefix": settings.API_V1_PREFIX,
        "modules": [
            "war-room", "hunt", "intel", "network",
            "ai-analyst", "alerts", "forensics",
            "ml-ops", "reports", "admin",
        ],
        "ml_models": [
            "isolation_forest",
            "random_forest",
            "autoencoder",
        ],
        "llm_providers": ["deepseek", "glm", "groq"],
        "threat_feeds": ["otx", "abuseipdb", "virustotal"],
    }
