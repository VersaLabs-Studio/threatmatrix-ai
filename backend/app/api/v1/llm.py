"""
ThreatMatrix AI — LLM API Endpoints

Per MASTER_DOC_PART2 §5.1:
  POST /llm/chat              → Streaming AI chat (SSE)
  POST /llm/analyze-alert/{id} → Generate alert narrative
  POST /llm/briefing           → Generate threat briefing
  POST /llm/translate          → Translate to Amharic
  GET  /llm/budget             → Token usage and budget
"""

from __future__ import annotations

import json
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/llm", tags=["LLM"])

# Gateway singleton — initialized in main.py lifespan
_gateway = None

def set_gateway(gateway):
    global _gateway
    _gateway = gateway

def get_gateway():
    if _gateway is None:
        raise HTTPException(status_code=503, detail="LLM Gateway not initialized")
    return _gateway


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    task_type: str = "chat"
    stream: bool = True

class AnalyzeAlertRequest(BaseModel):
    severity: str = ""
    category: str = ""
    source_ip: str = ""
    dest_ip: str = ""
    composite_score: float = 0.0
    if_score: float = 0.0
    rf_label: str = ""
    rf_confidence: float = 0.0
    ae_score: float = 0.0
    model_agreement: str = ""
    confidence: float = 0.0

class TranslateRequest(BaseModel):
    text: str

class BriefingRequest(BaseModel):
    total_flows: int = 0
    anomaly_count: int = 0
    anomaly_pct: float = 0.0
    alert_count: int = 0
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    top_categories: str = ""
    threat_level: str = "ELEVATED"


@router.post("/chat")
async def chat(request: ChatRequest):
    """Send message, get AI response (streaming SSE)."""
    gateway = get_gateway()
    from app.services.llm_gateway import TaskType

    task = TaskType(request.task_type) if request.task_type in TaskType.__members__.values() else TaskType.CHAT
    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    if request.stream:
        async def stream_response():
            async for token in gateway.stream_chat(messages=messages, task_type=task):
                yield f"data: {json.dumps({'token': token})}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(stream_response(), media_type="text/event-stream")
    else:
        result = await gateway.chat(messages=messages, task_type=task)
        return result


@router.post("/analyze-alert/{alert_id}")
async def analyze_alert(alert_id: str, request: Optional[AnalyzeAlertRequest] = None):
    """
    Generate AI narrative for an alert.
    If no request body is provided, it fetches the alert from the database.
    Persists the resulting narrative to the alerts table.
    """
    gateway = get_gateway()
    from app.database import async_session
    from app.services import alert_service
    from sqlalchemy import text
    from datetime import datetime, timezone

    # 1. Get alert data
    if request and any(v for v in request.model_dump().values()):
        alert_data = request.model_dump()
    else:
        # Fetch from database
        async with async_session() as session:
            alert = await alert_service.get_alert_by_id(session, alert_id)
            if not alert:
                raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
            
            alert_data = {
                "severity": alert.get("severity", "medium"),
                "category": alert.get("category", "anomaly"),
                "source_ip": alert.get("source_ip", "unknown"),
                "dest_ip": alert.get("dest_ip", "unknown"),
                "composite_score": alert.get("composite_score", 0.0),
                "if_score": alert.get("if_score", 0.0),
                "rf_label": alert.get("ml_model", "unknown"), # Use ml_model as label fallback
                "rf_confidence": alert.get("confidence", 0.0),
                "ae_score": alert.get("ae_score", 0.0),
                "model_agreement": "unknown",
                "confidence": alert.get("confidence", 0.0),
            }

    # 2. Generate narrative
    result = await gateway.analyze_alert(alert_data)
    narrative = result.get("content", "")

    # 3. Persist to database if generated successfully
    if narrative and not narrative.startswith("["):
        try:
            async with async_session() as session:
                await session.execute(
                    text(
                        "UPDATE alerts "
                        "SET ai_narrative = :narrative, updated_at = :now "
                        "WHERE alert_id = :alert_id OR id::text = :alert_id"
                    ),
                    {
                        "narrative": narrative,
                        "alert_id": alert_id,
                        "now": datetime.now(timezone.utc),
                    },
                )
                await session.commit()
                logger.info("[LLM] Persisted manual narrative for %s", alert_id)
        except Exception as e:
            logger.error("[LLM] Failed to persist narrative: %s", e)

    return {
        "alert_id": alert_id,
        "narrative": narrative,
        "model": result.get("model", ""),
        "tokens": {
            "input": result.get("tokens_in", 0),
            "output": result.get("tokens_out", 0),
        },
    }


@router.post("/briefing")
async def generate_briefing(request: BriefingRequest):
    """Generate daily threat briefing."""
    gateway = get_gateway()
    result = await gateway.generate_briefing(request.model_dump())
    return {
        "briefing": result.get("content", ""),
        "model": result.get("model", ""),
        "tokens": {
            "input": result.get("tokens_in", 0),
            "output": result.get("tokens_out", 0),
        },
    }


@router.post("/translate")
async def translate(request: TranslateRequest):
    """Translate text to Amharic."""
    gateway = get_gateway()
    result = await gateway.translate(request.text)
    return {
        "original": request.text,
        "translated": result.get("content", ""),
        "model": result.get("model", ""),
    }


@router.get("/budget")
async def get_budget():
    """Token usage and budget status (Redis-persisted)."""
    gateway = get_gateway()
    return await gateway.get_budget_status_async()


@router.get("/briefing/cached")
async def get_cached_briefing():
    """
    Get cached AI briefing from Redis.
    Returns cached briefing if available, otherwise triggers generation.
    Cache TTL: 5 minutes.
    """
    import time
    import redis.asyncio as aioredis

    CACHE_KEY = "warroom:briefing"
    CACHE_TTL = 300  # 5 minutes
    REDIS_URL = "redis://redis:6379"

    # Try to get cached briefing
    try:
        r = aioredis.from_url(REDIS_URL, decode_responses=True)
        cached = await r.get(CACHE_KEY)
        if cached:
            data = json.loads(cached)
            ttl = await r.ttl(CACHE_KEY)
            await r.close()
            return {
                "briefing": data.get("text", ""),
                "generated_at": data.get("generated_at", ""),
                "cached": True,
                "ttl_remaining": ttl,
            }
        await r.close()
    except Exception as e:
        logger.warning(f"[LLM] Failed to get cached briefing: {e}")

    # No cache available — generate new briefing
    gateway = get_gateway()
    briefing_request = BriefingRequest()
    result = await gateway.generate_briefing(briefing_request.model_dump())

    briefing_text = result.get("content", "")
    generated_at = time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime())

    # Cache the briefing
    try:
        r = aioredis.from_url(REDIS_URL, decode_responses=True)
        cache_data = json.dumps({
            "text": briefing_text,
            "generated_at": generated_at,
            "timestamp": int(time.time()),
        })
        await r.setex(CACHE_KEY, CACHE_TTL, cache_data)
        await r.close()
        logger.info(f"[LLM] Cached briefing ({len(briefing_text)} chars) for {CACHE_TTL}s")
    except Exception as e:
        logger.warning(f"[LLM] Failed to cache briefing: {e}")

    return {
        "briefing": briefing_text,
        "generated_at": generated_at,
        "cached": False,
        "model": result.get("model", ""),
        "tokens": {
            "input": result.get("tokens_in", 0),
            "output": result.get("tokens_out", 0),
        },
    }


@router.post("/briefing/invalidate")
async def invalidate_cached_briefing():
    """Invalidate cached briefing to force regeneration."""
    from app.redis import redis_manager

    try:
        await redis_manager.delete("warroom:briefing")
        return {"status": "invalidated", "message": "Cached briefing cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to invalidate cache: {e}")
