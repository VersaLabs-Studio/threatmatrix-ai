"""
ThreatMatrix AI — System Endpoints
Health check, system status, and configuration.
"""

from fastapi import APIRouter
from datetime import datetime, timezone

from app.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/health")
async def health_check():
    """System health check endpoint."""
    return {
        "status": "operational",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "components": {
            "api": "healthy",
            "database": "pending",     # TODO: actual DB ping
            "redis": "pending",        # TODO: actual Redis ping
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
