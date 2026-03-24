"""
ThreatMatrix AI — LLM Gateway Service

Per MASTER_DOC_PART4 §9.1: Multi-provider LLM routing.

Providers:
  - DeepSeek V3: Complex analysis, reasoning ($0.14/M in)
  - Groq Llama 3.3 70B: Real-time alerts, fast queries ($0.06/M)
  - GLM-4-Flash: Bulk tasks, translations ($0.01/M)

Routing:
  - Complex analysis → DeepSeek
  - Real-time alerts → Groq
  - Bulk/translation → GLM
  - Fallback → next available
"""

from __future__ import annotations

import logging
import os
from enum import Enum
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class LLMProvider(str, Enum):
    """Available LLM providers."""
    DEEPSEEK = "deepseek"
    GROQ = "groq"
    GLM = "glm"


class TaskType(str, Enum):
    """Task types for provider routing."""
    ALERT_ANALYSIS = "alert_analysis"
    DAILY_BRIEFING = "daily_briefing"
    IP_INVESTIGATION = "ip_investigation"
    CHAT = "chat"
    TRANSLATION = "translation"
    QUICK_SUMMARY = "quick_summary"


# Provider routing per PART4 §9.1
TASK_ROUTING: Dict[TaskType, List[LLMProvider]] = {
    TaskType.ALERT_ANALYSIS: [LLMProvider.DEEPSEEK, LLMProvider.GROQ],
    TaskType.DAILY_BRIEFING: [LLMProvider.DEEPSEEK, LLMProvider.GLM],
    TaskType.IP_INVESTIGATION: [LLMProvider.DEEPSEEK, LLMProvider.GROQ],
    TaskType.CHAT: [LLMProvider.DEEPSEEK, LLMProvider.GROQ],
    TaskType.TRANSLATION: [LLMProvider.GLM, LLMProvider.DEEPSEEK],
    TaskType.QUICK_SUMMARY: [LLMProvider.GROQ, LLMProvider.GLM],
}

# Prompt templates per PART4 §9.2
PROMPTS = {
    "alert_analysis": """You are ThreatMatrix AI Analyst, an expert cybersecurity analyst.
Analyze the following network security alert and provide:
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
- Isolation Forest: {if_score:.2f}
- Random Forest: {rf_label} ({rf_confidence:.0%})
- Autoencoder: {ae_score:.2f}
- Composite: {composite_score:.2f}

Provide your analysis in a clear, professional format.""",

    "daily_briefing": """You are ThreatMatrix AI, generating a daily cyber threat briefing.

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

Provide a risk assessment with confidence level.""",

    "translation": """Translate the following cybersecurity alert/report to Amharic (Amharic).
Maintain technical terms in English where Amharic equivalents don't exist.
Keep the professional tone.

Text to translate:
{text}""",
}


class LLMGateway:
    """
    Multi-provider LLM gateway with fallback routing.
    """

    def __init__(self) -> None:
        self.providers: Dict[LLMProvider, Dict[str, Any]] = {}
        self.stats: Dict[str, Any] = {
            "requests": 0,
            "tokens_in": 0,
            "tokens_out": 0,
            "cost_usd": 0.0,
        }
        self._init_providers()

    def _init_providers(self) -> None:
        """Initialize available providers from environment."""
        deepseek_key = os.environ.get("DEEPSEEK_API_KEY")
        groq_key = os.environ.get("GROQ_API_KEY")
        glm_key = os.environ.get("GLM_API_KEY")

        if deepseek_key:
            self.providers[LLMProvider.DEEPSEEK] = {
                "api_key": deepseek_key,
                "base_url": "https://api.deepseek.com/v1",
                "model": "deepseek-chat",
                "cost_per_m_in": 0.14,
                "cost_per_m_out": 0.28,
            }
            logger.info("[LLM] DeepSeek provider initialized")

        if groq_key:
            self.providers[LLMProvider.GROQ] = {
                "api_key": groq_key,
                "base_url": "https://api.groq.com/openai/v1",
                "model": "llama-3.3-70b-versatile",
                "cost_per_m_in": 0.06,
                "cost_per_m_out": 0.06,
            }
            logger.info("[LLM] Groq provider initialized")

        if glm_key:
            self.providers[LLMProvider.GLM] = {
                "api_key": glm_key,
                "base_url": "https://open.bigmodel.cn/api/paas/v4",
                "model": "glm-4-flash",
                "cost_per_m_in": 0.01,
                "cost_per_m_out": 0.01,
            }
            logger.info("[LLM] GLM provider initialized")

        if not self.providers:
            logger.warning("[LLM] No API keys configured. LLM features disabled.")

    def get_prompt(self, task_type: str, **kwargs: Any) -> str:
        """Build a prompt from template."""
        template = PROMPTS.get(task_type, "")
        try:
            return template.format(**kwargs)
        except KeyError as e:
            logger.error("[LLM] Missing prompt variable: %s", e)
            return template

    def select_provider(self, task_type: TaskType) -> Optional[LLMProvider]:
        """Select the best available provider for the task."""
        routing = TASK_ROUTING.get(task_type, list(LLMProvider))
        for provider in routing:
            if provider in self.providers:
                return provider
        return None

    def get_status(self) -> Dict[str, Any]:
        """Return gateway status."""
        return {
            "providers": {
                p.value: {"available": p in self.providers}
                for p in LLMProvider
            },
            "stats": self.stats,
            "prompts_available": list(PROMPTS.keys()),
        }
