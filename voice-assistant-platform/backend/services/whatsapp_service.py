from datetime import datetime, timezone

import httpx
from fastapi import HTTPException

from config import settings
from database.mongo import get_database
from services.session_service import session_service
from utils.logger import get_logger

logger = get_logger("services.whatsapp")


class WhatsAppService:
    def _ensure_config(self) -> None:
        missing = []
        if not settings.WHATSAPP_TOKEN:
            missing.append("WHATSAPP_TOKEN")
        if not settings.WHATSAPP_PHONE_NUMBER_ID:
            missing.append("WHATSAPP_PHONE_NUMBER_ID")
        if missing:
            raise HTTPException(status_code=503, detail=f"Integration not configured. Set {', '.join(missing)} in .env")

    def verify_webhook(self, mode: str | None, token: str | None, challenge: str | None) -> str | None:
        if mode == "subscribe" and token == settings.WHATSAPP_VERIFY_TOKEN:
            return challenge
        return None

    async def process_incoming(self, payload: dict) -> None:
        self._ensure_config()
        from_number, message_text = self._extract_message_text(payload)
        session = await session_service.create_session("whatsapp", "whatsapp")
        result = await session_service.process_text_message(session["session_id"], message_text)
        await self.send_message(from_number, result["response_text"])
        await self._log_integration("inbound", payload, "success", None)

    async def send_message(self, to: str, text: str) -> dict:
        self._ensure_config()
        url = f"https://graph.facebook.com/v20.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
        headers = {"Authorization": f"Bearer {settings.WHATSAPP_TOKEN}", "Content-Type": "application/json"}
        body = {"messaging_product": "whatsapp", "to": to, "type": "text", "text": {"body": text[:4096]}}
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(url, headers=headers, json=body)
            response.raise_for_status()
            await self._log_integration("outbound", body, "success", None)
            return response.json()

    def _extract_message_text(self, payload: dict) -> tuple[str, str]:
        entry = payload.get("entry", [{}])[0]
        value = entry.get("changes", [{}])[0].get("value", {})
        message = value.get("messages", [{}])[0]
        from_number = message.get("from", "")
        text = message.get("text", {}).get("body", "")
        return from_number, text

    async def _log_integration(self, direction: str, payload: dict, status: str, error: str | None):
        db = await get_database()
        await db.integration_logs.insert_one(
            {
                "integration": "whatsapp",
                "direction": direction,
                "payload": payload,
                "status": status,
                "error": error,
                "timestamp": datetime.now(timezone.utc),
            }
        )


whatsapp_service = WhatsAppService()
