"""
ThreatMatrix AI — FastAPI Application Entry Point
Application factory with middleware, CORS, and API router mounting.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.v1 import router as api_v1_router
from app.redis import RedisManager

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    # ── Startup ──────────────────────────────────────────────
    print(f"[TM] {settings.APP_NAME} v{settings.APP_VERSION} starting...")
    print(f"[TM] Database: {settings.DATABASE_URL.split('@')[-1]}")
    print(f"[TM] Redis: {settings.REDIS_URL}")
    
    # Initialize Redis connection
    redis_manager = RedisManager(url=settings.REDIS_URL)
    try:
        await redis_manager.connect()
        app.state.redis_manager = redis_manager
        print("[TM] Redis connected successfully")
    except Exception as e:
        print(f"[TM] Redis connection failed: {e}")
        app.state.redis_manager = None
    
    # Start WebSocket Redis listener
    from app.api.v1.websocket import manager as ws_manager
    if app.state.redis_manager:
        try:
            await ws_manager.start_redis_listener(app.state.redis_manager)
            print("[TM] WebSocket Redis listener started")
        except Exception as e:
            print(f"[TM] WebSocket Redis listener failed: {e}")

    # Start Flow Consumer (Redis → PostgreSQL persistence)
    from app.services.flow_consumer import FlowConsumer
    if app.state.redis_manager:
        try:
            flow_consumer = FlowConsumer(redis_url=settings.REDIS_URL)
            await flow_consumer.start()
            app.state.flow_consumer = flow_consumer
            print("[TM] Flow consumer started — persisting flows to PostgreSQL")
        except Exception as e:
            print(f"[TM] Flow consumer failed: {e}")
            app.state.flow_consumer = None

    yield
    
    # ── Shutdown ─────────────────────────────────────────────
    print(f"[TM] {settings.APP_NAME} shutting down...")
    
    # Stop Flow Consumer
    if hasattr(app.state, 'flow_consumer') and app.state.flow_consumer:
        try:
            await app.state.flow_consumer.stop()
            print("[TM] Flow consumer stopped")
        except Exception:
            pass

    # Stop WebSocket Redis listener
    try:
        await ws_manager.stop_redis_listener()
        print("[TM] WebSocket Redis listener stopped")
    except Exception:
        pass
    
    # Disconnect Redis
    if hasattr(app.state, 'redis_manager') and app.state.redis_manager:
        await app.state.redis_manager.disconnect()
        print("[TM] Redis disconnected")


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


# ── Dependencies ─────────────────────────────────────────────
def get_redis_manager() -> RedisManager | None:
    """
    FastAPI dependency to get Redis manager from app state.
    
    Usage:
        Access via request.app.state.redis_manager in endpoints.
        
        Example:
            @app.get("/endpoint")
            async def endpoint(request: Request):
                redis = request.app.state.redis_manager
                await redis.set("key", "value")
    """
    return None  # Placeholder - actual usage via request.app.state


# ── App Instance ─────────────────────────────────────────────
app = create_app()
