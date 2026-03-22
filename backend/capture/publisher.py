"""
ThreatMatrix AI — Flow Publisher

Publishes completed flows to Redis pub/sub for real-time pipeline.
Architecture: Capture Engine → Redis Pub/Sub → FastAPI → WebSocket → Browser

Per MASTER_DOC_PART2 §6.1
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Dict, List, Optional

import redis.asyncio as redis

logger = logging.getLogger(__name__)


class FlowPublisher:
    """
    Publish completed flows to Redis pub/sub channels.

    Channels:
    - flows:live    — All completed flow records
    - ml:live       — Anomaly detection events (future ML Worker)
    """

    def __init__(
        self,
        redis_url: str = "redis://localhost:6379",
        flow_channel: str = "flows:live",
        anomaly_channel: str = "ml:live",
    ) -> None:
        self.redis_url = redis_url
        self.flow_channel = flow_channel
        self.anomaly_channel = anomaly_channel
        self._client: Optional[redis.Redis] = None

    async def connect(self) -> None:
        """Establish Redis connection."""
        if self._client is not None:
            return

        self._client = redis.from_url(
            self.redis_url,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_keepalive=True,
        )
        # Verify connection
        await self._client.ping()
        logger.info("[Publisher] Connected to Redis at %s", self.redis_url)

    async def publish_flow(self, flow_data: Dict[str, Any]) -> None:
        """
        Publish a single completed flow to the flows:live channel.
        Includes automatic reconnection with exponential backoff.

        Args:
            flow_data: Flow record dict with features, metadata, etc.
        """
        message = json.dumps({
            "event": "new_flow",
            "payload": flow_data,
        })

        for attempt in range(3):
            try:
                if self._client is None:
                    await self.connect()
                subscribers = await self._client.publish(self.flow_channel, message)
                logger.debug(
                    "[Publisher] Flow published to %s (%d subscribers)",
                    self.flow_channel,
                    subscribers,
                )
                return
            except (ConnectionError, Exception) as exc:
                logger.warning(
                    "[Publisher] Redis connection lost (attempt %d/3): %s",
                    attempt + 1,
                    exc,
                )
                self._client = None
                if attempt < 2:
                    await asyncio.sleep(1 * (attempt + 1))  # Backoff: 1s, 2s
        logger.error("[Publisher] Failed to publish after 3 attempts")

    async def publish_batch(self, flows: List[Dict[str, Any]]) -> int:
        """
        Publish a batch of flows.

        Returns:
            Number of flows successfully published.
        """
        published = 0
        for flow in flows:
            try:
                await self.publish_flow(flow)
                published += 1
            except Exception as exc:
                logger.error("[Publisher] Failed to publish flow: %s", exc)
        return published

    async def publish_anomaly(self, flow_data: Dict[str, Any]) -> None:
        """
        Publish an anomaly detection event to the ml:live channel.
        Used by ML Worker when an anomaly is detected.
        """
        if self._client is None:
            await self.connect()

        message = json.dumps({
            "event": "anomaly_detected",
            "payload": flow_data,
        })

        await self._client.publish(self.anomaly_channel, message)
        logger.debug("[Publisher] Anomaly published to %s", self.anomaly_channel)

    async def publish_system_status(self, status: Dict[str, Any]) -> None:
        """
        Publish system status update to system:status channel.
        Used for capture engine status, system metrics, etc.
        """
        if self._client is None:
            await self.connect()

        message = json.dumps({
            "event": "capture_status",
            "payload": status,
        })

        await self._client.publish("system:status", message)

    async def close(self) -> None:
        """Close Redis connection."""
        if self._client is not None:
            await self._client.close()
            self._client = None
            logger.info("[Publisher] Redis connection closed")

    async def __aenter__(self) -> "FlowPublisher":
        await self.connect()
        return self

    async def __aexit__(self, *args: Any) -> None:
        await self.close()