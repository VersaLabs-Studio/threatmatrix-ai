"""
ThreatMatrix AI — LLM Gateway Service (OpenRouter)

ARCHITECTURAL DEVIATION from MASTER_DOC_PART4 §9.1:
  - All providers routed through OpenRouter (https://openrouter.ai/api/v1)
  - Single OPENROUTER_API_KEY replaces per-provider keys
  - Model routing preserved: task_type → best model for that task
  - Middleware stack unchanged: budget, cache, rate limit, prompt, token count

Providers via OpenRouter:
  - nvidia/llama-3.1-nemotron-ultra-253b-v1:free  → Complex analysis
  - stepfun/step-3.5-flash:free                    → Real-time alerts
  - openai/gpt-oss-120b:free                       → Chat / General
  - zhipu-ai/glm-4.1v-9b-thinking:free             → Bulk / Translation
  - qwen/qwen3-coder-480b-a35b:free                → Coding / Fallback
"""

from __future__ import annotations

import json
import logging
import os
import time
from datetime import datetime, timezone
from enum import Enum
from typing import Any, AsyncIterator, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


class TaskType(str, Enum):
    ALERT_ANALYSIS = "alert_analysis"
    DAILY_BRIEFING = "daily_briefing"
    IP_INVESTIGATION = "ip_investigation"
    CHAT = "chat"
    TRANSLATION = "translation"
    QUICK_SUMMARY = "quick_summary"


# Task → Model routing (preserves PART4 §9.1 logic)
TASK_MODEL_ROUTING: Dict[TaskType, List[str]] = {
    TaskType.ALERT_ANALYSIS: [
        "nvidia/llama-3.1-nemotron-ultra-253b-v1:free",
        "openai/gpt-oss-120b:free",
    ],
    TaskType.DAILY_BRIEFING: [
        "nvidia/llama-3.1-nemotron-ultra-253b-v1:free",
        "stepfun/step-3.5-flash:free",
    ],
    TaskType.IP_INVESTIGATION: [
        "nvidia/llama-3.1-nemotron-ultra-253b-v1:free",
        "openai/gpt-oss-120b:free",
    ],
    TaskType.CHAT: [
        "openai/gpt-oss-120b:free",
        "nvidia/llama-3.1-nemotron-ultra-253b-v1:free",
    ],
    TaskType.TRANSLATION: [
        "zhipu-ai/glm-4.1v-9b-thinking:free",
        "stepfun/step-3.5-flash:free",
    ],
    TaskType.QUICK_SUMMARY: [
        "stepfun/step-3.5-flash:free",
        "openai/gpt-oss-120b:free",
    ],
}

# System prompt for ThreatMatrix AI context
SYSTEM_PROMPT = """You are ThreatMatrix AI Analyst, an expert cybersecurity analyst integrated into a real-time network anomaly detection system.
You have access to ML model outputs (Isolation Forest, Random Forest, Autoencoder ensemble) and live network flow data.
Provide precise, actionable cybersecurity analysis. Use technical language appropriate for SOC analysts.
When analyzing alerts, reference specific ML model scores and feature importance.
Support both English and Amharic (አማርኛ) responses when requested."""

# Prompt templates per PART4 §9.2 (UNCHANGED)
PROMPTS = {
    "alert_analysis": """Analyze the following network security alert and provide:
1. A clear explanation of what happened
2. Why this is dangerous
3. Recommended immediate actions
4. Long-term remediation steps

Alert Details:
- Severity: {severity}
- Category: {category}
- Source IP: {source_ip} → Destination IP: {dest_ip}
- ML Confidence: {confidence:.0%}
- Model Agreement: {model_agreement}

ML Scores:
- Isolation Forest: {if_score:.3f}
- Random Forest: {rf_label} ({rf_confidence:.0%})
- Autoencoder: {ae_score:.3f}
- Composite: {composite_score:.3f}

Provide your analysis in a clear, professional format.""",

    "daily_briefing": """Generate a daily cyber threat briefing.

Network Statistics (Last 24 Hours):
- Total flows analyzed: {total_flows}
- Anomalous flows detected: {anomaly_count} ({anomaly_pct:.1f}%)
- Alerts generated: {alert_count}
  - Critical: {critical}, High: {high}, Medium: {medium}, Low: {low}
- Top attack categories: {top_categories}

Current Threat Level: {threat_level}

Generate a concise executive briefing covering:
1. Overall threat posture assessment
2. Key incidents and patterns
3. Recommendations for the security team
4. Predicted risk trend for next 24 hours""",

    "ip_investigation": """Investigate the following IP address for potential threats:

IP: {ip_address}
Internal observations:
- Flows involving this IP: {flow_count}
- Anomalous flows: {anomaly_count}
- Protocols used: {protocols}
- Ports accessed: {ports}
- First seen: {first_seen}
- Last seen: {last_seen}

External intelligence:
{intel_data}

Provide a risk assessment with confidence level.""",

    "translation": """Translate the following cybersecurity alert/report to Amharic (አማርኛ).
Maintain technical terms in English where Amharic equivalents don't exist.
Keep the professional tone.

Text to translate:
{text}""",
}


class LLMGateway:
    """
    Multi-model LLM gateway routed through OpenRouter.
    Preserves PART4 §9.1 task-type → model routing.
    """

    def __init__(self) -> None:
        self.api_key = os.environ.get("OPENROUTER_API_KEY", "")
        self.base_url = OPENROUTER_BASE_URL
        self.enabled = bool(self.api_key)
        self.stats = {
            "requests": 0,
            "tokens_in": 0,
            "tokens_out": 0,
            "errors": 0,
            "cost_usd": 0.0,
            "by_model": {},
        }
        self._client: Optional[httpx.AsyncClient] = None

        if self.enabled:
            logger.info("[LLM] OpenRouter gateway initialized (key present)")
        else:
            logger.warning("[LLM] OPENROUTER_API_KEY not set — LLM features disabled")

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "HTTP-Referer": "https://threatmatrix-ai.com",
                    "X-Title": "ThreatMatrix AI",
                    "Content-Type": "application/json",
                },
                timeout=120.0,
            )
        return self._client

    def select_model(self, task_type: TaskType) -> str:
        """Select best model for the task type."""
        models = TASK_MODEL_ROUTING.get(task_type, ["openai/gpt-oss-120b:free"])
        return models[0]  # Primary model; fallback handled in _call

    def get_prompt(self, template_name: str, **kwargs: Any) -> str:
        """Build a prompt from template."""
        template = PROMPTS.get(template_name, "")
        try:
            return template.format(**kwargs)
        except KeyError as e:
            logger.error("[LLM] Missing prompt variable: %s", e)
            return template

    async def chat(
        self,
        messages: List[Dict[str, str]],
        task_type: TaskType = TaskType.CHAT,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> Dict[str, Any]:
        """Send a chat completion request (non-streaming)."""
        if not self.enabled:
            return {"error": "LLM gateway not configured", "content": ""}

        model = self.select_model(task_type)
        client = await self._get_client()

        # Prepend system prompt
        full_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages

        payload = {
            "model": model,
            "messages": full_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        try:
            response = await client.post("/chat/completions", json=payload)
            response.raise_for_status()
            data = response.json()

            content = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})

            # Track stats
            self.stats["requests"] += 1
            self.stats["tokens_in"] += usage.get("prompt_tokens", 0)
            self.stats["tokens_out"] += usage.get("completion_tokens", 0)
            self.stats["by_model"][model] = self.stats["by_model"].get(model, 0) + 1

            logger.info(
                "[LLM] %s — %d in / %d out tokens",
                model.split("/")[-1],
                usage.get("prompt_tokens", 0),
                usage.get("completion_tokens", 0),
            )

            return {
                "content": content,
                "model": model,
                "tokens_in": usage.get("prompt_tokens", 0),
                "tokens_out": usage.get("completion_tokens", 0),
                "cost_usd": 0.0,  # Free tier
            }

        except httpx.HTTPStatusError as e:
            self.stats["errors"] += 1
            logger.error("[LLM] HTTP error: %s — %s", e.response.status_code, e.response.text[:200])
            # Fallback to secondary model
            return await self._fallback_chat(messages, task_type, temperature, max_tokens)
        except Exception as e:
            self.stats["errors"] += 1
            logger.error("[LLM] Request failed: %s", e)
            return {"error": str(e), "content": ""}

    async def _fallback_chat(
        self, messages, task_type, temperature, max_tokens
    ) -> Dict[str, Any]:
        """Try fallback model."""
        models = TASK_MODEL_ROUTING.get(task_type, [])
        if len(models) < 2:
            return {"error": "No fallback model available", "content": ""}

        fallback_model = models[1]
        client = await self._get_client()

        full_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages
        payload = {
            "model": fallback_model,
            "messages": full_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        try:
            response = await client.post("/chat/completions", json=payload)
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})
            self.stats["requests"] += 1
            logger.info("[LLM] Fallback to %s succeeded", fallback_model)
            return {"content": content, "model": fallback_model,
                    "tokens_in": usage.get("prompt_tokens", 0),
                    "tokens_out": usage.get("completion_tokens", 0), "cost_usd": 0.0}
        except Exception as e:
            self.stats["errors"] += 1
            return {"error": f"Fallback failed: {e}", "content": ""}

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        task_type: TaskType = TaskType.CHAT,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        """Stream chat completion tokens via SSE."""
        if not self.enabled:
            yield "[LLM gateway not configured]"
            return

        model = self.select_model(task_type)
        client = await self._get_client()

        full_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages
        payload = {
            "model": model,
            "messages": full_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }

        try:
            async with client.stream("POST", "/chat/completions", json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str.strip() == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data_str)
                            delta = chunk.get("choices", [{}])[0].get("delta", {})
                            if "content" in delta and delta["content"]:
                                yield delta["content"]
                        except json.JSONDecodeError:
                            continue

            self.stats["requests"] += 1
            logger.info("[LLM] Stream complete: %s", model.split("/")[-1])

        except Exception as e:
            self.stats["errors"] += 1
            logger.error("[LLM] Stream error: %s", e)
            yield f"[Error: {e}]"

    async def analyze_alert(self, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate LLM narrative for an alert."""
        prompt = self.get_prompt("alert_analysis", **alert_data)
        return await self.chat(
            messages=[{"role": "user", "content": prompt}],
            task_type=TaskType.ALERT_ANALYSIS,
            max_tokens=1500,
        )

    async def generate_briefing(self, stats_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate daily threat briefing."""
        prompt = self.get_prompt("daily_briefing", **stats_data)
        return await self.chat(
            messages=[{"role": "user", "content": prompt}],
            task_type=TaskType.DAILY_BRIEFING,
            max_tokens=2000,
        )

    async def translate(self, text: str) -> Dict[str, Any]:
        """Translate text to Amharic."""
        prompt = self.get_prompt("translation", text=text)
        return await self.chat(
            messages=[{"role": "user", "content": prompt}],
            task_type=TaskType.TRANSLATION,
            max_tokens=2000,
        )

    def get_budget_status(self) -> Dict[str, Any]:
        """Return budget and usage stats."""
        return {
            "enabled": self.enabled,
            "provider": "openrouter",
            "credits_loaded": 20.0,
            "stats": self.stats,
            "models_available": list(set(
                m for models in TASK_MODEL_ROUTING.values() for m in models
            )),
        }

    async def close(self) -> None:
        """Close HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
