"""
ThreatMatrix AI — Application Configuration
Pydantic BaseSettings for type-safe environment variable management.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── Application ──────────────────────────────────────────────
    APP_NAME: str = "ThreatMatrix AI"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # ── Database ─────────────────────────────────────────────────
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://threatmatrix:threatmatrix_dev@localhost:5432/threatmatrix",
        description="Async PostgreSQL connection string"
    )
    DATABASE_ECHO: bool = False

    # ── Redis ────────────────────────────────────────────────────
    REDIS_URL: str = Field(
        default="redis://localhost:6379",
        description="Redis connection URL"
    )

    # ── JWT Authentication ───────────────────────────────────────
    JWT_SECRET: str = Field(
        default="threatmatrix-dev-secret-change-in-production",
        description="JWT signing secret key"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── LLM Providers ───────────────────────────────────────────
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com/v1"
    GLM_API_KEY: str = ""
    GLM_BASE_URL: str = "https://open.bigmodel.cn/api/paas/v4"
    GROQ_API_KEY: str = ""
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    LLM_MONTHLY_BUDGET_USD: float = 50.0

    # ── Threat Intel ─────────────────────────────────────────────
    OTX_API_KEY: str = ""
    ABUSEIPDB_API_KEY: str = ""
    VIRUSTOTAL_API_KEY: str = ""

    # ── Capture ──────────────────────────────────────────────────
    CAPTURE_INTERFACE: str = "eth0"
    CAPTURE_BPF_FILTER: str = ""
    FLOW_TIMEOUT_SECONDS: int = 120

    # ── CORS ─────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://threatmatrix-ai.vercel.app",
    ]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
