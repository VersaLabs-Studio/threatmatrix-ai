"""
ThreatMatrix AI — Alert Engine

Subscribes to 'alerts:live' Redis channel.
Persists ML-generated alerts to PostgreSQL alerts table.
Broadcasts to WebSocket for real-time browser updates.

Per MASTER_DOC_PART2 §4.2 (alerts table schema).
Per MASTER_DOC_PART4 §12.1 steps [6]→[7]: LLM auto-narrative on alert creation.
Per MASTER_DOC_PART4 §11.3: IOC correlation on alert creation.

Pipeline:
  alerts:live → _process_alert()
    → INSERT alert
    → IOC Correlator (severity escalation if match)
    → Fire-and-forget LLM narrative (async, non-blocking)
"""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import redis.asyncio as redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session

logger = logging.getLogger(__name__)


class AlertEngine:
    """
    Consumes anomaly alerts from ML Worker and persists to PostgreSQL.
    """

    def __init__(
        self,
        redis_url: str = "redis://redis:6379",
        alert_channel: str = "alerts:live",
    ) -> None:
        self.redis_url = redis_url
        self.alert_channel = alert_channel
        self._redis: Optional[redis.Redis] = None
        self._running = False
        self.stats: Dict[str, Any] = {"alerts_persisted": 0, "errors": 0}

    async def start(self) -> None:
        """Start the alert engine."""
        logger.info("[AlertEngine] Starting...")

        self._redis = redis.from_url(
            self.redis_url, decode_responses=True,
            socket_connect_timeout=5,
        )
        await self._redis.ping()

        self._running = True
        pubsub = self._redis.pubsub()
        await pubsub.subscribe(self.alert_channel)
        logger.info("[AlertEngine] Subscribed to %s", self.alert_channel)

        try:
            async for message in pubsub.listen():
                if not self._running:
                    break
                if message["type"] != "message":
                    continue
                try:
                    await self._process_alert(message["data"])
                except Exception as exc:
                    self.stats["errors"] += 1
                    logger.error("[AlertEngine] Error: %s", exc)
        except asyncio.CancelledError:
            pass
        finally:
            await pubsub.unsubscribe(self.alert_channel)
            if self._redis:
                await self._redis.close()

    async def stop(self) -> None:
        """Stop the alert engine."""
        self._running = False
        logger.info(
            "[AlertEngine] Stopped — %d alerts persisted, %d errors",
            self.stats["alerts_persisted"],
            self.stats["errors"],
        )

    async def _process_alert(self, data: str) -> None:
        """Process and persist an alert."""
        msg = json.loads(data)
        if msg.get("event") != "new_alert":
            return

        payload = msg["payload"]

        # Insert alert per MASTER_DOC_PART2 §4.2 schema
        async with async_session() as session:
            alert_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc)

            # Generate unique alert reference (UUID-based to avoid duplicate key)
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
            unique_suffix = uuid.uuid4().hex[:8].upper()
            alert_ref = f"TM-{timestamp}-{unique_suffix}"

            # Map category for the alert
            category = payload.get("category", "anomaly")

            # Build flow_ids as UUID array
            flow_id_raw = payload.get("flow_id")
            flow_ids = [uuid.UUID(flow_id_raw)] if flow_id_raw else []

            insert_sql = text("""
                INSERT INTO alerts (
                    id, alert_id, severity, title, description,
                    category, source_ip, dest_ip, confidence,
                    status, ml_model, rf_label, flow_ids,
                    composite_score, if_score, rf_score, ae_score,
                    created_at, updated_at
                ) VALUES (
                    :id, :alert_id, :severity, :title, :description,
                    :category, :source_ip, :dest_ip, :confidence,
                    'open', :ml_model, :rf_label, :flow_ids,
                    :composite_score, :if_score, :rf_score, :ae_score,
                    :created_at, :updated_at
                )
            """)

            await session.execute(insert_sql, {
                "id": alert_id,
                "alert_id": alert_ref,
                "severity": payload.get("severity", "medium"),
                "title": payload.get("title", "ML Anomaly Detected"),
                "description": payload.get("description", ""),
                "category": category,
                "source_ip": payload.get("source_ip"),
                "dest_ip": payload.get("dest_ip"),
                "confidence": payload.get("composite_score", 0.0),
                "ml_model": "ensemble",
                "rf_label": payload.get("rf_label", "unknown"),
                "flow_ids": flow_ids,
                "composite_score": payload.get("composite_score", 0.0),
                "if_score": payload.get("if_score", 0.0),
                "rf_score": payload.get("rf_confidence", 0.0),
                "ae_score": payload.get("ae_score", 0.0),
                "created_at": now,
                "updated_at": now,
            })
            await session.commit()

        self.stats["alerts_persisted"] += 1
        logger.info(
            "[AlertEngine] Alert persisted: %s — %s (score=%.2f)",
            payload.get("severity"),
            category,
            payload.get("composite_score", 0.0),
        )

        # ── IOC Correlation (per MASTER_DOC_PART4 §11.3) ──────────
        # Check flow IPs against threat_intel_iocs; escalate severity if matched.
        # Runs BEFORE LLM narrative so the narrative reflects escalated severity.
        try:
            from app.services.ioc_correlator import IOCCorrelator

            correlator = IOCCorrelator()
            ioc_result = await correlator.correlate_flow(payload)

            if ioc_result["has_ioc_match"]:
                escalated_severity = ioc_result["escalation_severity"]
                async with async_session() as ioc_session:
                    await ioc_session.execute(
                        text(
                            "UPDATE alerts SET severity = :sev, updated_at = :now "
                            "WHERE alert_id = :aid"
                        ),
                        {
                            "sev": escalated_severity,
                            "aid": alert_ref,
                            "now": datetime.now(timezone.utc),
                        },
                    )
                    await ioc_session.commit()
                logger.info(
                    "[AlertEngine] IOC match! Escalated %s → %s",
                    alert_ref,
                    escalated_severity,
                )
                # Update payload severity so LLM narrative reflects escalation
                payload["severity"] = escalated_severity
        except Exception as ioc_exc:
            logger.error(
                "[AlertEngine] IOC correlation failed for %s: %s",
                alert_ref,
                ioc_exc,
            )

        # ── LLM Auto-Narrative (DISABLED AUTO-GEN TO PREVENT RATE LIMITS) ─
        # Narrative will be triggered on-demand via the UI or manual request.
        # if payload.get("severity", "medium").lower() != "low":
        #     # Fire-and-forget: alert persistence MUST NOT be blocked by LLM latency.
        #     asyncio.create_task(
        #         self._generate_narrative(alert_ref, payload)
        #     )
        # else:
        #     logger.info("[AlertEngine] Skipping LLM narrative for LOW severity alert: %s", alert_ref)

    async def _generate_narrative(
        self, alert_id: str, payload: Dict[str, Any]
    ) -> None:
        """
        Async LLM narrative generation for a new alert.
        Calls LLMGateway.analyze_alert() → UPDATE alert.ai_narrative.
        Non-blocking: failure does not block alert persistence.

        Per MASTER_DOC_PART4 §12.1 steps [6]→[7].
        """
        try:
            from app.services.llm_gateway import LLMGateway

            # Build alert data matching the alert_analysis prompt template
            # (PART4 §9.2 PROMPTS["alert_analysis"])
            alert_data = {
                "severity": payload.get("severity", "medium"),
                "category": payload.get("category", "anomaly"),
                "source_ip": payload.get("source_ip", "unknown"),
                "dest_ip": payload.get("dest_ip", "unknown"),
                "confidence": payload.get("composite_score", 0.0),
                "model_agreement": payload.get("model_agreement", "unknown"),
                "if_score": payload.get("if_score", 0.0),
                "rf_label": payload.get("rf_label", "unknown"),
                "rf_confidence": payload.get("rf_confidence", 0.0),
                "ae_score": payload.get("ae_score", 0.0),
                "composite_score": payload.get("composite_score", 0.0),
            }

            gateway = LLMGateway()
            result = await gateway.analyze_alert(alert_data)
            narrative = result.get("content", "")

            if narrative and not narrative.startswith("["):
                # UPDATE alert.ai_narrative in PostgreSQL
                async with async_session() as narrative_session:
                    await narrative_session.execute(
                        text(
                            "UPDATE alerts "
                            "SET ai_narrative = :narrative, updated_at = :now "
                            "WHERE alert_id = :alert_id"
                        ),
                        {
                            "narrative": narrative,
                            "alert_id": alert_id,
                            "now": datetime.now(timezone.utc),
                        },
                    )
                    await narrative_session.commit()

                logger.info(
                    "[AlertEngine] LLM narrative saved for %s (%d chars)",
                    alert_id,
                    len(narrative),
                )
            else:
                logger.warning(
                    "[AlertEngine] LLM returned empty/error for %s", alert_id
                )

            await gateway.close()

        except Exception as exc:
            logger.error(
                "[AlertEngine] Narrative generation failed for %s: %s",
                alert_id,
                exc,
            )
