from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from middleware.cors import add_cors
from middleware.rate_limiter import get_client_ip, limiter
from routers import auth, voice, analytics, integrations, health
from websockets import audio_stream
from database.mongo import connect_mongo, disconnect_mongo
from models.model_manager import model_manager
from utils.logger import configure_logging

configure_logging()
app = FastAPI(title="AI Voice Assistant Platform", docs_url="/docs", redoc_url="/redoc")
add_cors(app)


@app.on_event("startup")
async def startup():
    await connect_mongo()
    await model_manager.initialize()


@app.on_event("shutdown")
async def shutdown():
    await disconnect_mongo()


@app.middleware("http")
async def global_rate_limit(request: Request, call_next):
    if request.url.path.startswith("/docs") or request.url.path.startswith("/redoc"):
        return await call_next(request)
    limiter.check(get_client_ip(request), 100, 60)
    return await call_next(request)


@app.exception_handler(Exception)
async def catch_all(_, exc):
    return JSONResponse(status_code=500, content={"detail": str(exc)})


app.include_router(auth.router)
app.include_router(voice.router)
app.include_router(analytics.router)
app.include_router(integrations.router)
app.include_router(health.router)
app.include_router(audio_stream.router)
