import httpx
from fastapi import HTTPException
from config import settings


def ensure_configured():
    if not settings.whatsapp_token:
        raise HTTPException(status_code=503, detail="Integration not configured. Set WHATSAPP_TOKEN in .env")
    if not settings.whatsapp_phone_number_id:
        raise HTTPException(status_code=503, detail="Integration not configured. Set WHATSAPP_PHONE_NUMBER_ID in .env")


async def send_message(to: str, message: str):
    ensure_configured()
    url = f"https://graph.facebook.com/v20.0/{settings.whatsapp_phone_number_id}/messages"
    headers = {"Authorization": f"Bearer {settings.whatsapp_token}"}
    payload = {"messaging_product": "whatsapp", "to": to, "type": "text", "text": {"body": message}}
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
