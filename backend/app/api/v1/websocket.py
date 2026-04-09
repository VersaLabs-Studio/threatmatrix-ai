"""
ThreatMatrix AI — WebSocket Server
Real-time event broadcasting via WebSocket + Redis Pub/Sub.

Architecture (per MASTER_DOC_PART2 §6.1):
  Capture Engine ──► Redis Pub/Sub ──► FastAPI ──► WebSocket ──► Browser
                     (flows:live)      (subscriber)  (broadcast)  (N clients)

  ML Worker ─────► Redis Pub/Sub ──► FastAPI ──► WebSocket ──► Browser
                   (alerts:live)     (subscriber)  (broadcast)
"""

import asyncio
import json
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from fastapi.websockets import WebSocketState

from app.config import get_settings
from app.redis import (
    RedisManager,
    CHANNEL_FLOWS_LIVE,
    CHANNEL_ALERTS_LIVE,
    CHANNEL_SYSTEM_STATUS,
    CHANNEL_ML_LIVE,
)

router = APIRouter()

settings = get_settings()

# ── Connection Manager ─────────────────────────────────────────────
class ConnectionManager:
    """
    Manages WebSocket connections and channel subscriptions.
    
    Each client can subscribe to multiple channels.
    Redis pub/sub events are broadcast to all subscribed clients.
    """
    
    def __init__(self):
        # Map of WebSocket -> set of subscribed channels
        self.active_connections: dict[WebSocket, set[str]] = {}
        # Map of channel -> set of WebSockets
        self.channel_subscribers: dict[str, set[WebSocket]] = {
            CHANNEL_FLOWS_LIVE: set(),
            CHANNEL_ALERTS_LIVE: set(),
            CHANNEL_SYSTEM_STATUS: set(),
            CHANNEL_ML_LIVE: set(),
        }
        # Redis subscriber task
        self._redis_task: asyncio.Task | None = None
        self._redis_manager: RedisManager | None = None
    
    async def connect(self, websocket: WebSocket) -> None:
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.active_connections[websocket] = set()
    
    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a WebSocket connection and clean up subscriptions."""
        if websocket in self.active_connections:
            # Remove from all channel subscriptions
            channels = self.active_connections[websocket]
            for channel in channels:
                if channel in self.channel_subscribers:
                    self.channel_subscribers[channel].discard(websocket)
            del self.active_connections[websocket]
    
    async def subscribe(self, websocket: WebSocket, channels: list[str]) -> dict[str, Any]:
        """
        Subscribe a WebSocket to one or more channels.
        
        Returns subscription confirmation with channel list.
        """
        if websocket not in self.active_connections:
            return {"error": "Not connected"}
        
        subscribed = []
        for channel in channels:
            if channel in self.channel_subscribers:
                self.channel_subscribers[channel].add(websocket)
                self.active_connections[websocket].add(channel)
                subscribed.append(channel)
        
        return {
            "event": "subscribed",
            "channels": subscribed,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    
    async def unsubscribe(self, websocket: WebSocket, channels: list[str]) -> dict[str, Any]:
        """
        Unsubscribe a WebSocket from one or more channels.
        
        Returns unsubscription confirmation.
        """
        if websocket not in self.active_connections:
            return {"error": "Not connected"}
        
        unsubscribed = []
        for channel in channels:
            if channel in self.channel_subscribers:
                self.channel_subscribers[channel].discard(websocket)
                self.active_connections[websocket].discard(channel)
                unsubscribed.append(channel)
        
        return {
            "event": "unsubscribed",
            "channels": unsubscribed,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    
    async def broadcast_to_channel(self, channel: str, message: dict[str, Any]) -> None:
        """
        Broadcast a message to all subscribers of a channel.
        
        Sends to all connected clients subscribed to the channel.
        """
        if channel not in self.channel_subscribers:
            return
        
        # Get subscribers (copy to avoid modification during iteration)
        subscribers = list(self.channel_subscribers[channel])
        
        for websocket in subscribers:
            if websocket.client_state == WebSocketState.CONNECTED:
                try:
                    await websocket.send_json(message)
                except Exception:
                    # Connection broken, remove it
                    self.disconnect(websocket)
    
    async def start_redis_listener(self, redis_manager: RedisManager) -> None:
        """
        Start background task to listen for Redis pub/sub events.
        
        Broadcasts received messages to subscribed WebSocket clients.
        """
        self._redis_manager = redis_manager
        self._redis_task = asyncio.create_task(self._redis_listener())
    
    async def stop_redis_listener(self) -> None:
        """Stop the Redis listener task."""
        if self._redis_task:
            self._redis_task.cancel()
            try:
                await self._redis_task
            except asyncio.CancelledError:
                pass
    
    async def _redis_listener(self) -> None:
        """
        Background task that subscribes to Redis channels and broadcasts to WebSocket clients.
        """
        if not self._redis_manager:
            return
        
        try:
            # Subscribe to all channels
            pubsub = self._redis_manager._client.pubsub()
            await pubsub.subscribe(
                CHANNEL_FLOWS_LIVE,
                CHANNEL_ALERTS_LIVE,
                CHANNEL_SYSTEM_STATUS,
                CHANNEL_ML_LIVE,
            )
            
            # Listen for messages
            async for message in pubsub.listen():
                if message["type"] == "message":
                    channel = message["channel"]
                    data = message["data"]
                    
                    # Parse data
                    try:
                        if isinstance(data, bytes):
                            data = data.decode("utf-8")
                        payload = json.loads(data)
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        payload = {"raw": str(data)}
                    
                    # Broadcast to WebSocket subscribers
                    await self.broadcast_to_channel(channel, {
                        "channel": channel,
                        "data": payload,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    })
        
        except asyncio.CancelledError:
            # Task cancelled, clean up
            if self._redis_manager and self._redis_manager._client:
                try:
                    pubsub = self._redis_manager._client.pubsub()
                    await pubsub.unsubscribe()
                except Exception:
                    pass
        except Exception as e:
            print(f"[WS] Redis listener error: {e}")


# ── Global Connection Manager ──────────────────────────────────────
manager = ConnectionManager()


# ── JWT Token Validation ───────────────────────────────────────────
async def validate_token(token: str) -> dict[str, Any] | None:
    """
    Validate JWT token from WebSocket connection.
    
    Returns user info if valid, None if invalid.
    In DEV_MODE, skips token validation.
    """
    # DEV_MODE bypasses token requirement
    if settings.DEV_MODE:
        return {"user_id": "dev_user", "email": "dev@localhost", "role": "admin"}
    
    try:
        from app.services.auth_service import decode_token
        payload = decode_token(token)
        if payload:
            return {
                "user_id": payload.get("sub"),
                "email": payload.get("email"),
                "role": payload.get("role"),
            }
    except Exception:
        pass
    return None


# ── WebSocket Endpoint ─────────────────────────────────────────────
@router.websocket("/ws/")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str | None = Query(None, description="JWT authentication token"),
):
    """
    WebSocket endpoint for real-time event streaming.
    
    Connection URL: ws://localhost:8000/ws/?token=<jwt>
    
    Client Messages:
        {"action": "subscribe", "channels": ["flows:live", "alerts:live"]}
        {"action": "unsubscribe", "channels": ["flows:live"]}
        {"action": "ping"}
    
    Server Messages:
        {"event": "subscribed", "channels": [...]}
        {"event": "unsubscribed", "channels": [...]}
        {"event": "pong"}
        {"channel": "flows:live", "data": {...}}
        {"channel": "alerts:live", "data": {...}}
        {"channel": "system:status", "data": {...}}
    """
    # Validate token
    user = await validate_token(token or "")
    if not user:
        await websocket.close(code=4001, reason="Invalid or missing token")
        return
    
    # Accept connection
    await manager.connect(websocket)
    
    # Send welcome message
    await websocket.send_json({
        "event": "connected",
        "user": user,
        "available_channels": [
            CHANNEL_FLOWS_LIVE,
            CHANNEL_ALERTS_LIVE,
            CHANNEL_SYSTEM_STATUS,
            CHANNEL_ML_LIVE,
        ],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    
    try:
        # Message loop
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
            except json.JSONDecodeError:
                await websocket.send_json({
                    "event": "error",
                    "message": "Invalid JSON",
                })
                continue
            
            action = message.get("action")
            
            if action == "subscribe":
                channels = message.get("channels", [])
                result = await manager.subscribe(websocket, channels)
                await websocket.send_json(result)
            
            elif action == "unsubscribe":
                channels = message.get("channels", [])
                result = await manager.unsubscribe(websocket, channels)
                await websocket.send_json(result)
            
            elif action == "ping":
                await websocket.send_json({
                    "event": "pong",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
            
            else:
                await websocket.send_json({
                    "event": "error",
                    "message": f"Unknown action: {action}",
                })
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"[WS] Error: {e}")
        manager.disconnect(websocket)


# ── Helper Functions for Publishing Events ─────────────────────────
async def publish_flow_event(redis_manager: RedisManager, flow_data: dict[str, Any]) -> None:
    """Publish a new flow event to Redis."""
    await redis_manager.publish(CHANNEL_FLOWS_LIVE, json.dumps({
        "event": "new_flow",
        "payload": flow_data,
    }))


async def publish_alert_event(redis_manager: RedisManager, alert_data: dict[str, Any]) -> None:
    """Publish a new alert event to Redis."""
    await redis_manager.publish(CHANNEL_ALERTS_LIVE, json.dumps({
        "event": "new_alert",
        "payload": alert_data,
    }))


async def publish_alert_updated_event(redis_manager: RedisManager, alert_data: dict[str, Any]) -> None:
    """Publish an alert updated event to Redis."""
    await redis_manager.publish(CHANNEL_ALERTS_LIVE, json.dumps({
        "event": "alert_updated",
        "payload": alert_data,
    }))


async def publish_system_status(redis_manager: RedisManager, status_data: dict[str, Any]) -> None:
    """Publish system status update to Redis."""
    await redis_manager.publish(CHANNEL_SYSTEM_STATUS, json.dumps({
        "event": "system_metrics",
        "payload": status_data,
    }))
