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
from typing import Any, Dict, List, Optional

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
    """Generate AI narrative for an alert."""
    gateway = get_gateway()

    # If no body, try to load alert from DB
    if request:
        alert_data = request.model_dump()
    else:
        # Fetch from database
        alert_data = {
            "severity": "unknown",
            "category": "unknown",
            "source_ip": "unknown",
            "dest_ip": "unknown",
            "composite_score": 0.0,
            "if_score": 0.0,
            "rf_label": "unknown",
            "rf_confidence": 0.0,
            "ae_score": 0.0,
            "model_agreement": "unknown",
            "confidence": 0.0,
        }

    result = await gateway.analyze_alert(alert_data)
    return {
        "alert_id": alert_id,
        "narrative": result.get("content", ""),
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
