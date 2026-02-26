from datetime import datetime, timezone

from fastapi import APIRouter

from config import settings
from database.mongo import ping_database
from models.model_manager import model_manager
from gml.embedding_service import embedding_service

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health_check():
    db_ok, ping_ms = await ping_database()
    model_status = await model_manager.get_health()

    whatsapp_missing = [
        var
        for var, value in {
            "WHATSAPP_TOKEN": settings.WHATSAPP_TOKEN,
            "WHATSAPP_PHONE_NUMBER_ID": settings.WHATSAPP_PHONE_NUMBER_ID,
            "WHATSAPP_VERIFY_TOKEN": settings.WHATSAPP_VERIFY_TOKEN,
        }.items()
        if not value
    ]

    integrations = {
        "whatsapp": {"configured": len(whatsapp_missing) == 0, "missing_vars": whatsapp_missing},
        "n8n": {"configured": bool(settings.N8N_WEBHOOK_URL)},
        "mongodb": {"connected": db_ok},
    }

    available_count = sum(1 for m in model_status.values() if m.get("available"))
    overall = "healthy" if db_ok and available_count >= 3 else "degraded" if db_ok else "unhealthy"

    return {
        "status": overall,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": settings.APP_VERSION,
        "database": {"connected": db_ok, "ping_ms": ping_ms},
        "models": {
            "whisper": {
                "available": model_status["whisper"]["available"],
                "model": model_status["whisper"]["model_name"],
                "load_time_ms": model_status["whisper"]["load_time_ms"],
            },
            "ollama": {
                "available": model_status["ollama"]["available"],
                "model": model_status["ollama"]["model_name"],
                "host": settings.OLLAMA_HOST,
            },
            "tts": {
                "available": model_status["tts"]["available"],
                "model": model_status["tts"]["model_name"],
                "load_time_ms": model_status["tts"]["load_time_ms"],
            },
            "sentiment": {
                "available": model_status["sentiment"]["available"],
                "model": model_status["sentiment"]["model_name"],
                "load_time_ms": model_status["sentiment"]["load_time_ms"],
            },
            "emotion": model_status.get("emotion", {}),
        },
        "integrations": integrations,
        "gml": {
            "available": embedding_service.available,
            "embedding_model": embedding_service.MODEL_NAME,
            "dimensions": embedding_service.DIMENSIONS,
        },
    }
