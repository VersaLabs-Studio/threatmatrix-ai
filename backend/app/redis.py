"""
ThreatMatrix AI — Redis Connection Manager
Async Redis client with pub/sub support for real-time data pipeline.

Implements:
- Connection pooling with health checks
- Pub/Sub for real-time flow and alert broadcasting
- Cache operations for LLM response caching
- Graceful startup and shutdown
"""

import json
from typing import Any, Callable

import redis.asyncio as redis
from redis.asyncio.client import PubSub

from app.config import get_settings

settings = get_settings()

# ── Redis Channels ─────────────────────────────────────────────
CHANNEL_FLOWS_LIVE = "flows:live"
CHANNEL_ALERTS_LIVE = "alerts:live"
CHANNEL_SYSTEM_STATUS = "system:status"
CHANNEL_ML_LIVE = "ml:live"


class RedisManager:
    """
    Async Redis connection manager with pub/sub support.
    
    Usage:
        redis_manager = RedisManager(url="redis://localhost:6379")
        await redis_manager.connect()
        
        # Cache operations
        await redis_manager.set("key", "value", ex=3600)
        value = await redis_manager.get("key")
        
        # Pub/Sub
        await redis_manager.publish(CHANNEL_FLOWS_LIVE, {"flow": "data"})
        
        # Cleanup
        await redis_manager.disconnect()
    """
    
    def __init__(self, url: str, max_connections: int = 20):
        """
        Initialize Redis manager.
        
        Args:
            url: Redis connection URL
            max_connections: Maximum connection pool size
        """
        self.url = url
        self.max_connections = max_connections
        self._client: redis.Redis | None = None
        self._pubsub: PubSub | None = None
    
    async def connect(self) -> None:
        """
        Establish Redis connection with connection pooling.
        
        Raises:
            redis.ConnectionError: If Redis is not available
        """
        self._client = redis.from_url(
            self.url,
            max_connections=self.max_connections,
            decode_responses=True,
        )
        
        # Verify connection
        await self._client.ping()  # type: ignore[misc]
    
    async def disconnect(self) -> None:
        """Gracefully close Redis connection."""
        if self._pubsub:
            await self._pubsub.close()
            self._pubsub = None
        
        if self._client:
            await self._client.close()
            self._client = None
    
    @property
    def client(self) -> redis.Redis:
        """Get Redis client instance."""
        if self._client is None:
            raise RuntimeError("Redis not connected. Call connect() first.")
        return self._client
    
    async def health_check(self) -> dict:
        """
        Check Redis connection health.
        
        Returns:
            dict with status and latency info
        """
        try:
            import time
            start = time.monotonic()
            await self.client.ping()  # type: ignore[misc]
            latency_ms = (time.monotonic() - start) * 1000
            
            info = await self.client.info("server")
            
            return {
                "status": "healthy",
                "latency_ms": round(latency_ms, 2),
                "version": info.get("redis_version", "unknown"),
                "connected_clients": info.get("connected_clients", 0),
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
            }
    
    # ── Cache Operations ───────────────────────────────────────
    
    async def get(self, key: str) -> str | None:
        """
        Get value by key.
        
        Args:
            key: Cache key
            
        Returns:
            Value string or None if not found
        """
        return await self.client.get(key)
    
    async def set(
        self,
        key: str,
        value: str,
        ex: int | None = None,
    ) -> bool:
        """
        Set key-value pair with optional expiration.
        
        Args:
            key: Cache key
            value: Value to store
            ex: Expiration time in seconds
            
        Returns:
            True if successful
        """
        return await self.client.set(key, value, ex=ex)
    
    async def delete(self, key: str) -> int:
        """
        Delete key.
        
        Args:
            key: Cache key
            
        Returns:
            Number of keys deleted
        """
        return await self.client.delete(key)
    
    async def get_json(self, key: str) -> dict | None:
        """
        Get JSON value by key.
        
        Args:
            key: Cache key
            
        Returns:
            Parsed JSON dict or None
        """
        value = await self.get(key)
        if value is None:
            return None
        return json.loads(value)
    
    async def set_json(
        self,
        key: str,
        value: dict,
        ex: int | None = None,
    ) -> bool:
        """
        Set JSON value with optional expiration.
        
        Args:
            key: Cache key
            value: Dict to serialize as JSON
            ex: Expiration time in seconds
            
        Returns:
            True if successful
        """
        return await self.set(key, json.dumps(value), ex=ex)
    
    # ── Pub/Sub Operations ─────────────────────────────────────
    
    async def publish(self, channel: str, data: dict) -> int:
        """
        Publish message to channel.
        
        Args:
            channel: Channel name
            data: Message data (will be JSON serialized)
            
        Returns:
            Number of clients that received the message
        """
        message = json.dumps(data)
        return await self.client.publish(channel, message)
    
    async def subscribe(
        self,
        channel: str,
        handler: Callable[[dict], Any],
    ) -> PubSub:
        """
        Subscribe to channel with message handler.
        
        Args:
            channel: Channel name
            handler: Async callback for received messages
            
        Returns:
            PubSub instance for management
        """
        pubsub = self.client.pubsub()
        await pubsub.subscribe(channel)
        
        # Store for cleanup
        self._pubsub = pubsub
        
        return pubsub
    
    async def listen(self, pubsub: PubSub, handler: Callable[[dict], Any]) -> None:
        """
        Listen for messages on subscribed channels.
        
        Args:
            pubsub: PubSub instance from subscribe()
            handler: Async callback for received messages
        """
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    data = json.loads(message["data"])
                    await handler(data)
                except json.JSONDecodeError:
                    # Handle non-JSON messages
                    await handler({"raw": message["data"]})


# ── Global Instance ────────────────────────────────────────────
redis_manager = RedisManager(url=settings.REDIS_URL)
