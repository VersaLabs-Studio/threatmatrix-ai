"""
ThreatMatrix AI — FastAPI Application Entry Point
Application factory with middleware, CORS, and API router mounting.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.v1 import router as api_v1_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    # ── Startup ──────────────────────────────────────────────
    print(f"🛡️  {settings.APP_NAME} v{settings.APP_VERSION} starting...")
    print(f"📡 Database: {settings.DATABASE_URL.split('@')[-1]}")
    print(f"⚡ Redis: {settings.REDIS_URL}")
    yield
    # ── Shutdown ─────────────────────────────────────────────
    print(f"🛡️  {settings.APP_NAME} shutting down...")


def create_app() -> FastAPI:
    """Application factory."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "AI-Powered Network Anomaly Detection and Cyber Threat Intelligence System "
            "utilizing Machine Learning and Real-Time Traffic Analysis."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS ─────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── API Routes ───────────────────────────────────────────
    app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)

    return app


# ── App Instance ─────────────────────────────────────────────
app = create_app()
