"""
ThreatMatrix AI — Reports API

Per MASTER_DOC_PART2 §5.1:
  POST /reports/generate        → Generate report (async)
  GET  /reports/                → List generated reports
  GET  /reports/{id}/download   → Download report data

Per MASTER_DOC_PART3 §10.1 — 6 report types:
  daily_summary, incident, executive, ml_performance,
  network_health, compliance

Reports stored as JSON in system_config table (key = report:{uuid}).
PDF generation (ReportLab) deferred to Week 6 per timeline.
"""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text

from app.database import async_session

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Valid report types per PART3 §10.1 ────────────────────────────
VALID_REPORT_TYPES = {
    "daily_summary",
    "incident",
    "executive",
    "ml_performance",
    "network_health",
    "compliance",
}


class ReportRequest(BaseModel):
    """Report generation request schema."""

    report_type: str
    title: Optional[str] = None
    date_range_start: Optional[str] = None  # ISO 8601
    date_range_end: Optional[str] = None
    alert_id: Optional[str] = None  # Required for incident reports


# ── Data Gathering Helpers ─────────────────────────────────────────


async def _gather_daily_summary(session) -> dict:
    """
    Gather alert stats, flow stats, and IOC stats for the last 24 hours.
    Used by daily_summary and executive report types.
    """
    data: dict = {}

    # Alert statistics (last 24h)
    alert_stats = await session.execute(
        text(
            "SELECT severity, COUNT(*) as cnt "
            "FROM alerts "
            "WHERE created_at >= NOW() - INTERVAL '24 hours' "
            "GROUP BY severity "
            "ORDER BY cnt DESC"
        )
    )
    data["alert_stats"] = [
        {"severity": row[0], "count": row[1]} for row in alert_stats.fetchall()
    ]

    # Flow statistics (last 24h)
    flow_stats = await session.execute(
        text(
            "SELECT COUNT(*), "
            "       COUNT(*) FILTER (WHERE is_anomaly = true), "
            "       AVG(anomaly_score) FILTER (WHERE anomaly_score > 0) "
            "FROM network_flows "
            "WHERE created_at >= NOW() - INTERVAL '24 hours'"
        )
    )
    row = flow_stats.fetchone()
    data["flow_stats"] = {
        "total_flows": row[0] if row else 0,
        "anomalous_flows": row[1] if row else 0,
        "avg_anomaly_score": round(float(row[2] or 0), 4),
    }

    # IOC statistics
    ioc_stats = await session.execute(
        text(
            "SELECT ioc_type, COUNT(*) "
            "FROM threat_intel_iocs "
            "WHERE is_active = true "
            "GROUP BY ioc_type"
        )
    )
    data["ioc_stats"] = [
        {"type": row[0], "count": row[1]} for row in ioc_stats.fetchall()
    ]

    return data


async def _gather_ml_performance(session) -> dict:
    """Gather ML model registry data for performance reports."""
    models = await session.execute(
        text(
            "SELECT name, model_type, metrics, status "
            "FROM ml_models "
            "ORDER BY created_at DESC "
            "LIMIT 10"
        )
    )
    return {
        "models": [
            {
                "name": row[0],
                "type": row[1],
                "metrics": row[2],
                "status": row[3],
            }
            for row in models.fetchall()
        ]
    }


async def _gather_incident(session, alert_id: str) -> dict:
    """Fetch single alert details for incident reports."""
    alert = await session.execute(
        text(
            "SELECT id, alert_id, severity, title, description, "
            "       category, source_ip, dest_ip, confidence, status, "
            "       ml_model, composite_score, ai_narrative, created_at "
            "FROM alerts "
            "WHERE alert_id = :aid OR id::text = :aid"
        ),
        {"aid": alert_id},
    )
    row = alert.fetchone()
    if not row:
        return {"error": f"Alert {alert_id} not found"}

    return {
        "alert": {
            "id": str(row[0]),
            "alert_id": row[1],
            "severity": row[2],
            "title": row[3],
            "description": row[4],
            "category": row[5],
            "source_ip": str(row[6]) if row[6] else None,
            "dest_ip": str(row[7]) if row[7] else None,
            "confidence": row[8],
            "status": row[9],
            "ml_model": row[10],
            "composite_score": row[11],
            "ai_narrative": row[12],
            "created_at": str(row[13]) if row[13] else None,
        }
    }


async def _gather_network_health(session) -> dict:
    """Gather protocol distribution for network health reports."""
    protos = await session.execute(
        text(
            "SELECT protocol, COUNT(*) as cnt "
            "FROM network_flows "
            "WHERE created_at >= NOW() - INTERVAL '7 days' "
            "GROUP BY protocol "
            "ORDER BY cnt DESC"
        )
    )
    return {
        "protocol_distribution": [
            {"protocol": row[0], "count": row[1]} for row in protos.fetchall()
        ]
    }


async def _gather_compliance(session) -> dict:
    """Gather alert response time and resolution rate data."""
    # Alerts by status
    status_stats = await session.execute(
        text(
            "SELECT status, COUNT(*) "
            "FROM alerts "
            "WHERE created_at >= NOW() - INTERVAL '7 days' "
            "GROUP BY status"
        )
    )
    by_status = {row[0]: row[1] for row in status_stats.fetchall()}

    total = sum(by_status.values())
    resolved = by_status.get("resolved", 0)
    false_positive = by_status.get("false_positive", 0)

    return {
        "alert_response": {
            "total_alerts": total,
            "resolved": resolved,
            "false_positive": false_positive,
            "open": by_status.get("open", 0),
            "acknowledged": by_status.get("acknowledged", 0),
            "investigating": by_status.get("investigating", 0),
            "resolution_rate": round(resolved / total * 100, 1) if total > 0 else 0.0,
        }
    }


# ── Endpoints ──────────────────────────────────────────────────────


@router.post("/generate")
async def generate_report(request: ReportRequest) -> dict:
    """
    Generate a report (async).
    Per MASTER_DOC_PART3 §10.1: 6 report types supported.

    Reports are generated as JSON summaries. PDF generation
    (ReportLab) is planned for Week 6 per project timeline.
    """
    if request.report_type not in VALID_REPORT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid report_type '{request.report_type}'. "
            f"Valid types: {sorted(VALID_REPORT_TYPES)}",
        )

    report_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    async with async_session() as session:
        # Gather data based on report type
        report_data: dict = {}

        if request.report_type in ("daily_summary", "executive"):
            report_data = await _gather_daily_summary(session)

        elif request.report_type == "ml_performance":
            report_data = await _gather_ml_performance(session)

        elif request.report_type == "incident":
            if not request.alert_id:
                raise HTTPException(
                    status_code=400,
                    detail="alert_id is required for incident reports",
                )
            report_data = await _gather_incident(session, request.alert_id)

        elif request.report_type == "network_health":
            report_data = await _gather_network_health(session)

        elif request.report_type == "compliance":
            report_data = await _gather_compliance(session)

        # Persist report metadata in system_config table
        report_value = json.dumps(
            {
                "id": report_id,
                "report_type": request.report_type,
                "title": request.title
                or f"{request.report_type.replace('_', ' ').title()} Report",
                "status": "complete",
                "data": report_data,
                "generated_at": now.isoformat(),
                "format": "json",
            }
        )

        await session.execute(
            text(
                "INSERT INTO system_config (key, value, description, updated_at) "
                "VALUES (:key, :value, :desc, :now) "
                "ON CONFLICT (key) DO UPDATE SET value = :value, updated_at = :now"
            ),
            {
                "key": f"report:{report_id}",
                "value": report_value,
                "desc": f"Generated report: {request.report_type}",
                "now": now,
            },
        )
        await session.commit()

    logger.info(
        "[Reports] Generated %s report %s", request.report_type, report_id
    )

    return {
        "id": report_id,
        "report_type": request.report_type,
        "title": request.title
        or f"{request.report_type.replace('_', ' ').title()} Report",
        "status": "complete",
        "data": report_data,
        "generated_at": now.isoformat(),
    }


@router.get("/")
async def list_reports(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    """
    List all generated reports (paginated).
    Per MASTER_DOC_PART2 §5.1.
    """
    async with async_session() as session:
        result = await session.execute(
            text(
                "SELECT key, value, updated_at "
                "FROM system_config "
                "WHERE key LIKE 'report:%' "
                "ORDER BY updated_at DESC "
                "LIMIT :limit OFFSET :offset"
            ),
            {"limit": limit, "offset": offset},
        )
        rows = result.fetchall()

        count_result = await session.execute(
            text("SELECT COUNT(*) FROM system_config WHERE key LIKE 'report:%'")
        )
        total = count_result.scalar() or 0

    reports = []
    for r in rows:
        try:
            data = r[1] if isinstance(r[1], dict) else json.loads(r[1])
            reports.append(
                {
                    "id": data.get("id", r[0].replace("report:", "")),
                    "report_type": data.get("report_type", "unknown"),
                    "title": data.get("title", "Report"),
                    "status": data.get("status", "complete"),
                    "generated_at": data.get("generated_at", str(r[2])),
                    "format": data.get("format", "json"),
                }
            )
        except (json.JSONDecodeError, TypeError):
            logger.warning("[Reports] Skipping malformed report entry: %s", r[0])
            continue

    return {
        "reports": reports,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{report_id}/download")
async def download_report(report_id: str) -> dict:
    """
    Download a generated report.
    Per MASTER_DOC_PART2 §5.1.

    Returns full report data as JSON. PDF generation (ReportLab)
    is planned for Week 6.
    """
    async with async_session() as session:
        result = await session.execute(
            text("SELECT value FROM system_config WHERE key = :key"),
            {"key": f"report:{report_id}"},
        )
        row = result.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Report not found")

    data = row[0] if isinstance(row[0], dict) else json.loads(row[0])

    return {
        "id": report_id,
        "report_type": data.get("report_type"),
        "title": data.get("title"),
        "data": data.get("data", {}),
        "generated_at": data.get("generated_at"),
        "format": "json",
        "note": "PDF generation available in Week 6 (ReportLab)",
    }
