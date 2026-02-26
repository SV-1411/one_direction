import asyncio
from datetime import datetime, timezone
import httpx

from config import settings
from utils.logger import get_logger

logger = get_logger("n8n")


async def trigger_n8n_alert(session_id: str, trigger_reason: str, analysis_data: dict):
    if not settings.n8n_webhook_url:
        logger.warning("n8n_not_configured")
        return

    payload = {
        "event": "voice_assistant_alert",
        "trigger": trigger_reason,
        "session_id": session_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "analysis": analysis_data,
        "session_url": f"http://localhost:3000/sessions/{session_id}",
    }

    backoff = 1
    for attempt in range(1, 4):
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(settings.n8n_webhook_url, json=payload)
                response.raise_for_status()
            logger.info("n8n_triggered", attempt=attempt)
            return
        except Exception as exc:
            logger.warning("n8n_retry", attempt=attempt, error=str(exc))
            await asyncio.sleep(backoff)
            backoff *= 2
