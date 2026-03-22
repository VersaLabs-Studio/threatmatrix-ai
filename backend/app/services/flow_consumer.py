"""
ThreatMatrix AI — Flow Consumer Service

Subscribes to Redis pub/sub channel `flows:live` and persists completed
network flows to PostgreSQL via FlowPersistence.

Architecture (per MASTER_DOC_PART2 §6.1):
  Capture Engine ──► Redis Pub/Sub ──► FlowConsumer ──► PostgreSQL
                     (flows:live)      (this service)   (network_flows)

Per MASTER_DOC_PART2 §4.2 (network_flows table)
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Any, Dict, List

import redis.asyncio as aioredis

from app.database import async_session
from app.redis import CHANNEL_FLOWS_LIVE
from app.services.flow_persistence import FlowPersistence

logger = logging.getLogger(__name__)


class FlowConsumer:
    """
    Redis pub/sub consumer for persisting network flows to PostgreSQL.

    Subscribes to the `flows:live` channel, buffers incoming flows,
    and batch-inserts them to the `network_flows` table periodically.

    Usage:
        consumer = FlowConsumer(redis_manager)
        await consumer.start()   # runs until stop() is called
        await consumer.stop()
    """

    def __init__(
        self,
        redis_url: str,
        flush_interval: float = 2.0,
        batch_size: int = 50,
    ) -> None:
        """
        Initialize the flow consumer.

        Args:
            redis_url: Redis connection URL (e.g. redis://localhost:6379).
            flush_interval: Seconds between batch flushes to PostgreSQL.
            batch_size: Maximum flows per batch insert.
        """
        self.redis_url = redis_url
        self.flush_interval = flush_interval
        self.batch_size = batch_size

        self._redis: aioredis.Redis | None = None
        self._buffer: List[Dict[str, Any]] = []
        self._running = False
        self._flush_task: asyncio.Task | None = None
        self._consumer_task: asyncio.Task | None = None

        # Stats
        self.stats: Dict[str, Any] = {
            "flows_received": 0,
            "flows_persisted": 0,
            "persist_errors": 0,
            "batches_flushed": 0,
            "start_time": None,
        }

    async def start(self) -> None:
        """Start the flow consumer (runs until stop() is called)."""
        if self._running:
            logger.warning("[FlowConsumer] Already running")
            return

        self._running = True
        self.stats["start_time"] = time.time()

        logger.info(
            "[FlowConsumer] Starting — channel=%s flush_interval=%.1fs batch_size=%d",
            CHANNEL_FLOWS_LIVE,
            self.flush_interval,
            self.batch_size,
        )

        # Create dedicated Redis connection for pub/sub
        self._redis = aioredis.from_url(
            self.redis_url,
            decode_responses=True,
            socket_connect_timeout=5,
        )
        await self._redis.ping()
        logger.info("[FlowConsumer] Connected to Redis at %s", self.redis_url)

        # Start background tasks
        self._flush_task = asyncio.create_task(self._flush_loop())

        # Start Redis subscriber (blocking loop)
        self._consumer_task = asyncio.create_task(self._consume_loop())

        logger.info("[FlowConsumer] Started successfully")

    async def stop(self) -> None:
        """Stop the flow consumer and flush remaining buffer."""
        if not self._running:
            return

        logger.info("[FlowConsumer] Stopping...")
        self._running = False

        # Cancel background tasks
        if self._consumer_task:
            self._consumer_task.cancel()
            try:
                await self._consumer_task
            except asyncio.CancelledError:
                pass

        if self._flush_task:
            self._flush_task.cancel()
            try:
                await self._flush_task
            except asyncio.CancelledError:
                pass

        # Flush remaining buffer
        if self._buffer:
            await self._flush_buffer()

        # Close Redis connection
        if self._redis:
            await self._redis.close()
            self._redis = None

        logger.info(
            "[FlowConsumer] Stopped — %d flows persisted, %d errors",
            self.stats["flows_persisted"],
            self.stats["persist_errors"],
        )

    def get_status(self) -> Dict[str, Any]:
        """Get current consumer status."""
        elapsed = 0.0
        if self.stats["start_time"]:
            elapsed = time.time() - self.stats["start_time"]

        return {
            "running": self._running,
            "buffer_size": len(self._buffer),
            "flows_received": self.stats["flows_received"],
            "flows_persisted": self.stats["flows_persisted"],
            "persist_errors": self.stats["persist_errors"],
            "batches_flushed": self.stats["batches_flushed"],
            "uptime_seconds": round(elapsed, 1),
        }

    # ── Consumer Loop ──────────────────────────────────────────

    async def _consume_loop(self) -> None:
        """
        Subscribe to Redis `flows:live` channel and buffer incoming flows.

        Listens for messages with event type `new_flow` and adds the
        payload to the internal buffer.
        """
        pubsub = self._redis.pubsub()

        try:
            await pubsub.subscribe(CHANNEL_FLOWS_LIVE)
            logger.info("[FlowConsumer] Subscribed to %s", CHANNEL_FLOWS_LIVE)

            async for message in pubsub.listen():
                if not self._running:
                    break

                if message["type"] != "message":
                    continue

                try:
                    data = message["data"]
                    if isinstance(data, bytes):
                        data = data.decode("utf-8")
                    payload = json.loads(data)
                except (json.JSONDecodeError, UnicodeDecodeError) as exc:
                    logger.debug("[FlowConsumer] Skipping malformed message: %s", exc)
                    continue

                event = payload.get("event")
                if event == "new_flow":
                    flow_data = payload.get("payload", {})
                    self._buffer.append(flow_data)
                    self.stats["flows_received"] += 1

                    # Flush if buffer exceeds batch size
                    if len(self._buffer) >= self.batch_size:
                        await self._flush_buffer()

        except asyncio.CancelledError:
            logger.debug("[FlowConsumer] Consume loop cancelled")
        except Exception as exc:
            logger.error("[FlowConsumer] Consume loop error: %s", exc)
        finally:
            try:
                await pubsub.unsubscribe(CHANNEL_FLOWS_LIVE)
                await pubsub.close()
            except Exception:
                pass

    # ── Flush Loop ─────────────────────────────────────────────

    async def _flush_loop(self) -> None:
        """Periodically flush buffered flows to PostgreSQL."""
        while self._running:
            try:
                await asyncio.sleep(self.flush_interval)
                if self._buffer:
                    await self._flush_buffer()
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.error("[FlowConsumer] Flush loop error: %s", exc)

    async def _flush_buffer(self) -> None:
        """
        Flush buffered flows to PostgreSQL using batch insert.

        Drains the internal buffer and persists all flows in a single
        transaction via FlowPersistence.
        """
        if not self._buffer:
            return

        # Drain buffer atomically
        batch = self._buffer[:]
        self._buffer.clear()

        try:
            async with async_session() as session:
                persistence = FlowPersistence(session)
                saved = await persistence.save_batch(batch)

            self.stats["flows_persisted"] += saved
            self.stats["batches_flushed"] += 1

            if saved < len(batch):
                self.stats["persist_errors"] += len(batch) - saved

            logger.debug(
                "[FlowConsumer] Flushed batch: %d/%d flows persisted",
                saved,
                len(batch),
            )
        except Exception as exc:
            self.stats["persist_errors"] += len(batch)
            logger.error(
                "[FlowConsumer] Failed to flush batch of %d flows: %s",
                len(batch),
                exc,
            )
            # Re-add failed flows to buffer for retry (up to batch size)
            self._buffer = batch[: self.batch_size] + self._buffer
