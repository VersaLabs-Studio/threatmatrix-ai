"""
ThreatMatrix AI — System Endpoints
Health check, system status, and configuration.
"""

import os

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


@router.get("/config")
async def system_config():
    """
    System configuration.
    Per MASTER_DOC_PART2 §5.1.

    Returns non-sensitive configuration values.
    API keys are NOT exposed in this response.
    """
    return {
        "capture": {
            "engine": "scapy",
            "features_per_flow": 63,
            "interface": os.environ.get("CAPTURE_INTERFACE", "eth0"),
        },
        "ml": {
            "ensemble_weights": {
                "isolation_forest": 0.30,
                "random_forest": 0.45,
                "autoencoder": 0.25,
            },
            "alert_thresholds": {
                "critical": 0.90,
                "high": 0.75,
                "medium": 0.50,
                "low": 0.30,
            },
            "dataset": "nsl_kdd",
            "scoring_mode": "ensemble",
        },
        "threat_intel": {
            "otx_enabled": bool(os.environ.get("OTX_API_KEY")),
            "abuseipdb_enabled": bool(os.environ.get("ABUSEIPDB_API_KEY")),
            "virustotal_enabled": bool(os.environ.get("VIRUSTOTAL_API_KEY")),
            "sync_interval_hours": 6,
        },
        "llm": {
            "provider": "openrouter",
            "models_count": 3,
        },
        "system": {
            "version": "0.4.0",
            "environment": os.environ.get("ENVIRONMENT", "production"),
            "dev_mode": os.environ.get("DEV_MODE", "false").lower() == "true",
        },
    }
