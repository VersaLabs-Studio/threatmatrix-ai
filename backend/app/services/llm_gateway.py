"""
ThreatMatrix AI — LLM Gateway Service (OpenRouter)

ARCHITECTURAL DEVIATION from MASTER_DOC_PART4 §9.1:
  - All providers routed through OpenRouter (https://openrouter.ai/api/v1)
  - Single OPENROUTER_API_KEY replaces per-provider keys
  - Model routing preserved: task_type → best model for that task
  - Middleware stack unchanged: budget, cache, rate limit, prompt, token count

Verified providers via OpenRouter (March 25, 2026):
  - nvidia/nemotron-3-super-120b-a12b:free  → Complex analysis (120B MoE, 12B active)
  - openai/gpt-oss-120b:free                → Chat / General  (117B MoE, 5.1B active)
  - stepfun/step-3.5-flash:free             → Real-time / Translation (196B MoE, 11B active)
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
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


CASCADING_MODELS = [
    "openai/gpt-oss-120b:free",
    "openrouter/free",
    "minimax/minimax-m2.5:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "arcee-ai/trinity-large-preview:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "z-ai/glm-4.5-air:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",

]

# Task → Model routing (preserves PART4 §9.1 logic)
TASK_MODEL_ROUTING: Dict[TaskType, List[str]] = {
    TaskType.ALERT_ANALYSIS: CASCADING_MODELS,
    TaskType.DAILY_BRIEFING: CASCADING_MODELS,
    TaskType.IP_INVESTIGATION: CASCADING_MODELS,
    TaskType.CHAT: CASCADING_MODELS,
    TaskType.TRANSLATION: CASCADING_MODELS,
    TaskType.QUICK_SUMMARY: CASCADING_MODELS,
}

# System prompt for ThreatMatrix AI context — Demo-optimized
SYSTEM_PROMPT = """You are ThreatMatrix AI Analyst, an expert cybersecurity analyst integrated into a real-time network anomaly detection system.

## YOUR ROLE
You analyze network security alerts using outputs from three ML models (Isolation Forest, Random Forest, Autoencoder) and provide clear, actionable insights.

## RESPONSE GUIDELINES
1. **Be concise but thorough** — Use structured sections (Summary, Analysis, Recommendations)
2. **Use tables for data** — Present ML scores, IoCs, and action items in markdown tables
3. **Reference ML outputs** — Always mention Isolation Forest score, Random Forest label/confidence, Autoencoder error
4. **Be actionable** — Provide specific, numbered remediation steps (block IP, quarantine host, collect logs)
5. **Use markdown formatting** — Headings, tables, bold, lists, code blocks for commands
6. **Keep it professional** — SOC analyst tone, but accessible to non-experts (avoid excessive jargon)
7. **Include MITRE ATT&CK** — Map findings to relevant tactics/techniques when applicable
8. **Bilingual support** — Respond in English by default; provide Amharic (አማርኛ) when requested

## RESPONSE STRUCTURE (use when relevant)
### 1. Executive Summary — One paragraph overview
### 2. ML Model Analysis — Table with scores and what they mean
### 3. Threat Assessment — What the attack is, how it works, potential impact
### 4. MITRE ATT&CK Mapping — Relevant tactics/techniques
### 5. Immediate Actions — Prioritized containment steps (P1, P2, P3)
### 6. Long-term Remediation — Hardening and monitoring improvements
### 7. TL;DR — Quick summary for SOC leads

## IMPORTANT
- Never invent data — only reference information provided in the prompt
- Use realistic but clearly labeled examples when data is missing
- Always provide at least 3 actionable recommendations
- Format code commands in markdown code blocks
- Keep responses under 1500 words for readability"""

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
        from app.config import get_settings
        self._settings = get_settings()
        self.api_key = self._settings.OPENROUTER_API_KEY
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
        self._redis: Any = None
        self._semaphore = asyncio.Semaphore(self._settings.LLM_MAX_CONCURRENT)

        if self.enabled:
            logger.info("[LLM] OpenRouter gateway initialized (key present)")
        else:
            logger.warning("[LLM] OPENROUTER_API_KEY not set — LLM features disabled")

    def set_redis(self, redis_manager: Any) -> None:
        """Set Redis manager for persistent budget tracking."""
        self._redis = redis_manager

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

    async def _persist_usage(
        self,
        model: str,
        tokens_in: int,
        tokens_out: int,
    ) -> None:
        """Persist token usage to Redis for cross-restart budget tracking."""
        if self._redis is None:
            return
        try:
            client = self._redis.client
            await client.incrby("llm:tokens_in", tokens_in)
            await client.incrby("llm:tokens_out", tokens_out)
            await client.hincrby("llm:requests_by_model", model, 1)
            # All models are free tier — cost tracked as 0 but structure ready
            await client.incrbyfloat("llm:cost_usd", 0.0)
        except Exception as e:
            logger.warning("[LLM] Redis persist failed: %s", e)

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
            MAX_RETRIES = self._settings.LLM_MAX_RETRIES
            RETRY_DELAY = self._settings.LLM_RETRY_DELAY
            
            for attempt in range(MAX_RETRIES):
                async with self._semaphore:
                    response = await client.post("/chat/completions", json=payload)
                    
                    if response.status_code == 429:
                        wait = RETRY_DELAY * (2 ** attempt)
                        logger.warning("[LLM] Rate limited (429). Retrying in %ds... (Attempt %d/%d)", 
                                       wait, attempt + 1, MAX_RETRIES)
                        await asyncio.sleep(wait)
                        continue
                        
                    response.raise_for_status()
                    data = response.json()

                    content = data["choices"][0]["message"]["content"]
                    usage = data.get("usage", {})

                    # Track stats
                    self.stats["requests"] += 1
                    self.stats["tokens_in"] += usage.get("prompt_tokens", 0)
                    self.stats["tokens_out"] += usage.get("completion_tokens", 0)
                    self.stats["by_model"][model] = self.stats["by_model"].get(model, 0) + 1

                    # Persist to Redis (fire-and-forget)
                    await self._persist_usage(
                        model=model,
                        tokens_in=usage.get("prompt_tokens", 0),
                        tokens_out=usage.get("completion_tokens", 0),
                    )

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

            # If we exhausted retries with 429
            logger.error("[LLM] Exhausted retries for 429 Rate Limit")
            return await self._fallback_chat(messages, task_type, temperature, max_tokens)

        except httpx.HTTPStatusError as e:
            self.stats["errors"] += 1
            logger.error("[LLM] HTTP error: %s — %s", e.response.status_code, e.response.text[:200])
            # Fallback to secondary model
            return await self._fallback_chat(messages, task_type, temperature, max_tokens)
        except Exception as e:
            self.stats["errors"] += 1
            logger.error("[LLM] Unexpected error: %s", e)
            return {"error": str(e), "content": "[LLM temporarily unavailable — please retry]"}

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
            for attempt in range(len(models) - 1):
                fallback_model = models[attempt + 1]
                logger.info("[LLM] Attempting fallback model: %s", fallback_model)
                
                payload["model"] = fallback_model
                
                MAX_RETRIES = self._settings.LLM_MAX_RETRIES
                RETRY_DELAY = self._settings.LLM_RETRY_DELAY
                
                for r in range(MAX_RETRIES):
                    async with self._semaphore:
                        response = await client.post("/chat/completions", json=payload)
                        
                        if response.status_code == 429:
                            wait = RETRY_DELAY * (2 ** r)
                            await asyncio.sleep(wait)
                            continue
                            
                        response.raise_for_status()
                        data = response.json()
                        content = data["choices"][0]["message"]["content"]
                        usage = data.get("usage", {})
                        self.stats["requests"] += 1
                        logger.info("[LLM] Fallback to %s succeeded", fallback_model)
                        return {"content": content, "model": fallback_model,
                                "tokens_in": usage.get("prompt_tokens", 0),
                                "tokens_out": usage.get("completion_tokens", 0), "cost_usd": 0.0}
            
            return {"error": "All fallback models rate limited or failed", 
                    "content": "[System currently under high load — please try again in 1 minute]"}
        except Exception as e:
            self.stats["errors"] += 1
            logger.error("[LLM] Fallback also failed: %s", e)
            return {"error": f"Fallback failed: {e}", "content": "[All LLM models unavailable — please retry later]"}

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

        models = TASK_MODEL_ROUTING.get(task_type, ["openai/gpt-oss-120b:free"])
        client = await self._get_client()
        full_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages
        
        for model in models:
            payload = {
                "model": model,
                "messages": full_messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": True,
            }

            MAX_RETRIES = self._settings.LLM_MAX_RETRIES
            RETRY_DELAY = self._settings.LLM_RETRY_DELAY
            
            for attempt in range(MAX_RETRIES):
                try:
                    async with self._semaphore:
                        async with client.stream("POST", "/chat/completions", json=payload) as response:
                            if response.status_code == 429:
                                wait = RETRY_DELAY * (2 ** attempt)
                                logger.warning("[LLM] Stream rate limited (429). Retrying in %ds...", wait)
                                await asyncio.sleep(wait)
                                continue
                                
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
                            return # Success!

                except Exception as e:
                    if attempt == MAX_RETRIES - 1:
                        logger.error("[LLM] Stream failed for model %s: %s", model, e)
                    else:
                        await asyncio.sleep(RETRY_DELAY)
                        continue
            
            logger.warning("[LLM] Model %s failed, trying fallback...", model)

        yield "[All models currently rate limited or unavailable - please try again later]"

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
        """Return budget and usage stats (Redis-persisted with in-memory fallback)."""
        return {
            "enabled": self.enabled,
            "provider": "openrouter",
            "credits_loaded": 20.0,
            "stats": self.stats,
            "models_available": list(set(
                m for models in TASK_MODEL_ROUTING.values() for m in models
            )),
            "persistent": self._redis is not None,
        }

    async def get_budget_status_async(self) -> Dict[str, Any]:
        """Return budget and usage stats from Redis (persistent)."""
        base = self.get_budget_status()

        if self._redis is None:
            return base

        try:
            client = self._redis.client
            tokens_in = await client.get("llm:tokens_in")
            tokens_out = await client.get("llm:tokens_out")
            cost_usd = await client.get("llm:cost_usd")
            by_model_raw = await client.hgetall("llm:requests_by_model")

            base["stats"] = {
                "requests": sum(int(v) for v in by_model_raw.values()) if by_model_raw else self.stats["requests"],
                "tokens_in": int(tokens_in) if tokens_in else self.stats["tokens_in"],
                "tokens_out": int(tokens_out) if tokens_out else self.stats["tokens_out"],
                "errors": self.stats["errors"],
                "cost_usd": float(cost_usd) if cost_usd else self.stats["cost_usd"],
                "by_model": {k: int(v) for k, v in by_model_raw.items()} if by_model_raw else self.stats["by_model"],
            }
        except Exception as e:
            logger.warning("[LLM] Redis budget read failed: %s", e)

        return base

    async def close(self) -> None:
        """Close HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
