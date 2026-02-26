from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request

from config import settings
from database.mongo import get_db
from services.session_service import process_text_like, start_session
from services.whatsapp_service import ensure_configured, send_message

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


@router.get("/whatsapp/webhook")
async def verify_webhook(hub_mode: str | None = None, hub_verify_token: str | None = None, hub_challenge: str | None = None):
    if hub_mode == "subscribe" and hub_verify_token == settings.whatsapp_verify_token:
        return int(hub_challenge or 0)
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/whatsapp/webhook")
async def whatsapp_webhook(request: Request):
    ensure_configured()
    payload = await request.json()
    db = get_db()
    try:
        entry = payload["entry"][0]["changes"][0]["value"]["messages"][0]
        user_text = entry.get("text", {}).get("body", "")
        from_number = entry.get("from")
        sid = await start_session("whatsapp", "whatsapp")
        result = await process_text_like(sid, text=user_text)
        await send_message(from_number, result["response_text"])
        await db.integration_logs.insert_one({
            "integration": "whatsapp",
            "direction": "inbound",
            "payload": payload,
            "status": "success",
            "timestamp": datetime.now(timezone.utc),
        })
        return {"status": "ok"}
    except Exception as exc:
        await db.integration_logs.insert_one({
            "integration": "whatsapp",
            "direction": "inbound",
            "payload": payload,
            "status": "failed",
            "error": str(exc),
            "timestamp": datetime.now(timezone.utc),
        })
        raise


@router.post("/crm/mock")
async def crm_mock(payload: dict):
    return {"status": "received", "payload": payload}
