import asyncio
import time
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from config import settings
from database.mongo import close_database, get_database, init_database
from gml.gml_router import router as gml_router
from gml.memory_decay import memory_decay
from gml.memory_engine import memory_engine
from middleware.auth_middleware import get_current_admin
from middleware.cors import add_cors
from middleware.rate_limiter import limiter
from models.model_manager import model_manager
from routers import analytics, auth, emotion, health, integrations, voice
from services.session_service import session_service
from models.tts_service import tts_service
from utils.helpers import generate_api_key, hash_password
from utils.logger import bind_request_context, clear_request_context, configure_logging, get_logger
from ws.audio_stream import router as ws_router

configure_logging()
logger = get_logger("main")

app = FastAPI(
    title=settings.APP_NAME,
    description="Production-ready AI voice assistant platform with local model integrations",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS MUST BE ADDED FIRST - NO EXCEPTIONS
add_cors(app)

# Default root route to check if server is reachable
@app.get("/")
async def root():
    return {"status": "online", "message": "AI Voice Assistant API"}

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    start = time.perf_counter()
    bind_request_context(request)
    try:
        response = await call_next(request)
    except Exception as exc:
        logger.error("request_failed", error=str(exc), method=request.method, path=request.url.path)
        clear_request_context()
        return JSONResponse(status_code=500, content={"error": {"message": str(exc), "type": exc.__class__.__name__}})
    duration_ms = int((time.perf_counter() - start) * 1000)
    logger.info("request_complete", method=request.method, path=request.url.path, status=response.status_code, duration_ms=duration_ms)
    clear_request_context()
    return response


@app.on_event("startup")
async def on_startup():
    await init_database()
    await model_manager.initialize()
    await model_manager.warmup_all()
    await memory_engine.initialize()
    db = await get_database()
    asyncio.create_task(memory_decay.schedule_decay_loop(db, interval_hours=24))
    if await db.users.count_documents({}) == 0:
        await db.users.insert_one(
            {
                "username": settings.DEFAULT_ADMIN_USERNAME,
                "email": settings.DEFAULT_ADMIN_EMAIL,
                "hashed_password": hash_password(settings.DEFAULT_ADMIN_PASSWORD),
                "role": "admin",
                "api_key": generate_api_key(),
                "created_at": datetime.now(timezone.utc),
                "last_login": None,
                "refresh_jti": None,
            }
        )


@app.on_event("shutdown")
async def on_shutdown():
    await tts_service.cleanup_old_files(settings.AUDIO_RETENTION_HOURS)
    await close_database()


app.include_router(auth.router)
app.include_router(voice.router)
app.include_router(analytics.router)
app.include_router(integrations.router)
app.include_router(health.router)
app.include_router(emotion.router)
app.include_router(gml_router)
app.include_router(ws_router)
