"""
ThreatMatrix AI — System Endpoints
Health check, system status, and configuration.
"""

import os
import json
import time

from fastapi import APIRouter, Request
from datetime import datetime, timezone

from app.config import get_settings

router = APIRouter()
settings = get_settings()


async def _check_database_health(request: Request) -> dict:
    """Check PostgreSQL database health with actual ping."""
    try:
        from app.database import async_session
        from sqlalchemy import text

        start = time.monotonic()
        async with async_session() as session:
            result = await session.execute(text("SELECT 1"))
            await result.fetchone()
        latency_ms = (time.monotonic() - start) * 1000
        return {"status": "healthy", "latency_ms": round(latency_ms, 2)}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


async def _check_capture_engine_health(request: Request) -> dict:
    """Check capture engine health via database stats."""
    try:
        from app.database import async_session
        from sqlalchemy import text

        async with async_session() as session:
            # Get total live flows
            result = await session.execute(
                text("SELECT COUNT(*) FROM flows WHERE source = 'live'")
            )
            live_flows = result.scalar() or 0

            # Get total packets
            result = await session.execute(
                text("SELECT COALESCE(SUM(total_packets), 0) FROM flows WHERE source = 'live'")
            )
            total_packets = result.scalar() or 0

            if live_flows > 0:
                return {
                    "status": "active",
                    "packets_captured": int(total_packets),
                    "flows_completed": int(live_flows),
                }
            return {"status": "idle", "reason": "No traffic captured yet"}
    except Exception as e:
        return {"status": "error", "error": str(e)}


async def _check_ml_worker_health(request: Request) -> dict:
    """Check ML worker health via database stats."""
    try:
        from app.database import async_session
        from sqlalchemy import text

        async with async_session() as session:
            # Get total flows scored (flows with anomaly_score)
            result = await session.execute(
                text("SELECT COUNT(*) FROM flows WHERE anomaly_score IS NOT NULL")
            )
            flows_scored = result.scalar() or 0

            # Get anomalies detected
            result = await session.execute(
                text("SELECT COUNT(*) FROM flows WHERE is_anomaly = true")
            )
            anomalies = result.scalar() or 0

            # Get alerts created
            result = await session.execute(
                text("SELECT COUNT(*) FROM alerts")
            )
            alerts = result.scalar() or 0

            if flows_scored > 0:
                return {
                    "status": "active",
                    "flows_scored": int(flows_scored),
                    "anomalies_detected": int(anomalies),
                    "alerts_created": int(alerts),
                }
            return {"status": "idle", "reason": "No flows scored yet"}
    except Exception as e:
        return {"status": "error", "error": str(e)}


@router.get("/health")
async def health_check(request: Request):
    """System health check endpoint with actual component status."""

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

    # Check actual component health (not hardcoded)
    db_health = await _check_database_health(request)
    capture_health = await _check_capture_engine_health(request)
    ml_health = await _check_ml_worker_health(request)

    # Determine overall status
    component_statuses = {
        "api": "healthy",
        "database": db_health.get("status", "unknown"),
        "redis": {
            "status": redis_status,
            "latency_ms": redis_latency,
        },
        "capture_engine": capture_health.get("status", "unknown"),
        "ml_worker": ml_health.get("status", "unknown"),
    }

    unhealthy = [
        k for k, v in component_statuses.items()
        if isinstance(v, str) and v in ("unhealthy", "error", "unavailable")
    ]

    overall_status = "operational" if not unhealthy else "degraded"

    return {
        "status": overall_status,
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "components": component_statuses,
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
