from fastapi import APIRouter
from config import settings
from models.model_manager import model_manager

router = APIRouter(tags=["health"])


@router.get("/api/health")
async def health():
    integrations = {
        "whatsapp": bool(settings.whatsapp_token and settings.whatsapp_phone_number_id),
        "n8n": bool(settings.n8n_webhook_url),
        "huggingface": bool(settings.huggingface_token),
    }
    return {"status": "ok", "models": model_manager.health(), "integrations": integrations}
