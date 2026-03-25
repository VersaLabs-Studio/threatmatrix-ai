"""
ThreatMatrix AI — Alert Engine

Subscribes to 'alerts:live' Redis channel.
Persists ML-generated alerts to PostgreSQL alerts table.
Broadcasts to WebSocket for real-time browser updates.

Per MASTER_DOC_PART2 §4.2 (alerts table schema).
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
            # Previous approach used in-memory counter that reset on restart
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
                    status, ml_model, flow_ids,
                    composite_score, if_score, rf_score, ae_score,
                    created_at, updated_at
                ) VALUES (
                    :id, :alert_id, :severity, :title, :description,
                    :category, :source_ip, :dest_ip, :confidence,
                    'open', :ml_model, :flow_ids,
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
