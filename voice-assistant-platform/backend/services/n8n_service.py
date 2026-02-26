import asyncio
from datetime import datetime, timezone

import httpx

from config import settings
from database.mongo import insert_integration_log
from utils.logger import get_logger

logger = get_logger("services.n8n")


class N8nService:
    async def trigger_alert(self, session_id: str, trigger_reason: str, analysis_data: dict, session_data: dict) -> None:
        if not settings.N8N_WEBHOOK_URL:
            logger.warning("n8n_not_configured")
            return

        payload = {
            "event": "voice_assistant_alert",
            "trigger": trigger_reason,
            "session_id": session_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "analysis": analysis_data,
            "session_url": f"http://localhost:3000/sessions/{session_id}",
            "session": session_data,
        }

        delays = [2, 4, 8]
        for attempt, delay in enumerate(delays, start=1):
            try:
                async with httpx.AsyncClient(timeout=10) as client:
                    response = await client.post(settings.N8N_WEBHOOK_URL, json=payload)
                    response.raise_for_status()
                await insert_integration_log(
                    {
                        "integration": "n8n",
                        "direction": "outbound",
                        "payload": payload,
                        "status": "success",
                        "timestamp": datetime.now(timezone.utc),
                    }
                )
                return
            except Exception as exc:
                logger.warning("n8n_trigger_failed", attempt=attempt, error=str(exc))
                if attempt == len(delays):
                    await insert_integration_log(
                        {
                            "integration": "n8n",
                            "direction": "outbound",
                            "payload": payload,
                            "status": "failed",
                            "error": str(exc),
                            "timestamp": datetime.now(timezone.utc),
                        }
                    )
                await asyncio.sleep(delay)


n8n_service = N8nService()
