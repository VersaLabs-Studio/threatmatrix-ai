"""
ThreatMatrix AI — Flow Score Updater

Subscribes to 'ml:scored' Redis channel.
Updates network_flows with anomaly_score and is_anomaly.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Dict, Optional

import redis.asyncio as redis
from sqlalchemy import text

from app.database import async_session

logger = logging.getLogger(__name__)


class FlowScoreUpdater:
    """Updates flow records with ML scoring results."""

    def __init__(
        self,
        redis_url: str = "redis://redis:6379",
        channel: str = "ml:scored",
    ) -> None:
        self.redis_url = redis_url
        self.channel = channel
        self._redis: Optional[redis.Redis] = None
        self._running = False
        self.stats: Dict[str, Any] = {"flows_updated": 0, "errors": 0}

    async def start(self) -> None:
        """Start the score updater."""
        self._redis = redis.from_url(self.redis_url, decode_responses=True)
        await self._redis.ping()

        self._running = True
        pubsub = self._redis.pubsub()
        await pubsub.subscribe(self.channel)
        logger.info("[FlowScorer] Subscribed to %s", self.channel)

        try:
            async for message in pubsub.listen():
                if not self._running:
                    break
                if message["type"] != "message":
                    continue
                try:
                    await self._process_score(message["data"])
                except Exception as exc:
                    self.stats["errors"] += 1
                    logger.error("[FlowScorer] Error: %s", exc)
        except asyncio.CancelledError:
            pass
        finally:
            await pubsub.unsubscribe(self.channel)
            if self._redis:
                await self._redis.close()

    async def stop(self) -> None:
        """Stop the score updater."""
        self._running = False
        logger.info(
            "[FlowScorer] Stopped — %d flows updated, %d errors",
            self.stats["flows_updated"],
            self.stats["errors"],
        )

    async def _process_score(self, data: str) -> None:
        """Update flow with ML score."""
        msg = json.loads(data)
        if msg.get("event") != "flow_scored":
            return

        payload = msg["payload"]
        flow_id = payload.get("flow_id")
        if not flow_id:
            return

        async with async_session() as session:
            update_sql = text("""
                UPDATE network_flows
                SET anomaly_score = :score,
                    is_anomaly = :is_anomaly,
                    label = :label,
                    ml_model = 'ensemble'
                WHERE id = :flow_id
            """)
            await session.execute(update_sql, {
                "score": payload.get("anomaly_score", 0.0),
                "is_anomaly": payload.get("is_anomaly", False),
                "label": payload.get("label"),
                "flow_id": flow_id,
            })
            await session.commit()

        self.stats["flows_updated"] += 1

        if self.stats["flows_updated"] % 100 == 0:
            logger.info(
                "[FlowScorer] Stats: %d flows updated",
                self.stats["flows_updated"],
            )
