import asyncio
import os
import uuid
from datetime import datetime, timezone

from database.mongo import get_db
from models.whisper_service import whisper_service
from models.ollama_service import ollama_service
from models.tts_service import tts_service
from models.sentiment_service import sentiment_service
from services.urgency_service import score as urgency_score
from services.fraud_service import evaluate as fraud_evaluate
from services.n8n_service import trigger_n8n_alert
from config import settings


async def start_session(user_id: str, channel: str) -> str:
    db = get_db()
    session_id = str(uuid.uuid4())
    await db.voice_sessions.insert_one(
        {
            "session_id": session_id,
            "user_id": user_id,
            "channel": channel,
            "status": "active",
            "started_at": datetime.now(timezone.utc),
            "total_messages": 0,
            "peak_urgency_score": 0.0,
            "peak_fraud_score": 0.0,
            "escalation_required": False,
            "metadata": {},
        }
    )
    return session_id


async def process_audio_file(session_id: str, audio_bytes: bytes) -> dict:
    os.makedirs(settings.audio_storage_path, exist_ok=True)
    audio_path = os.path.join(settings.audio_storage_path, f"{uuid.uuid4()}.wav")
    with open(audio_path, "wb") as f:
        f.write(audio_bytes)
    return await process_text_like(session_id, audio_path=audio_path)


async def process_text_like(session_id: str, text: str | None = None, audio_path: str | None = None) -> dict:
    db = get_db()
    history = await db.messages.find({"session_id": session_id}).to_list(length=100)

    if audio_path:
        transcript = whisper_service.transcribe(audio_path)
    else:
        transcript = text or ""

    response_text = await ollama_service.chat(transcript, history)

    try:
        sentiment = sentiment_service.analyze(transcript)
    except Exception:
        sentiment = {"sentiment": "neutral", "sentiment_score": 0.0, "label_scores": {"neutral": 1.0}}

    urgency = urgency_score(transcript, sentiment)
    fraud = fraud_evaluate(transcript, history)

    try:
        tts_bytes, tts_path = tts_service.synthesize(response_text)
    except Exception:
        tts_bytes, tts_path = b"", None

    analysis = {
        **sentiment,
        "urgency_score": urgency,
        "fraud_risk": fraud["fraud_risk"],
        "fraud_signals": fraud["fraud_signals"],
        "escalation_required": fraud["escalation_required"] or urgency > settings.urgency_alert_threshold,
    }

    now = datetime.now(timezone.utc)
    await db.messages.insert_many(
        [
            {
                "session_id": session_id,
                "role": "user",
                "transcript": transcript,
                "sentiment": sentiment["sentiment"],
                "sentiment_score": sentiment["sentiment_score"],
                "urgency_score": urgency,
                "fraud_risk": fraud["fraud_risk"],
                "escalation_required": analysis["escalation_required"],
                "processing_time_ms": 0,
                "timestamp": now,
            },
            {
                "session_id": session_id,
                "role": "assistant",
                "transcript": response_text,
                "audio_path": tts_path,
                "sentiment": "neutral",
                "sentiment_score": 0.0,
                "urgency_score": 0.0,
                "fraud_risk": 0.0,
                "escalation_required": False,
                "processing_time_ms": 0,
                "timestamp": now,
            },
        ]
    )

    await db.voice_sessions.update_one(
        {"session_id": session_id},
        {
            "$inc": {"total_messages": 2},
            "$max": {"peak_urgency_score": urgency, "peak_fraud_score": fraud["fraud_risk"]},
            "$set": {"escalation_required": analysis["escalation_required"]},
        },
    )

    if analysis["escalation_required"]:
        trigger = "fraud_detected" if fraud["fraud_risk"] > settings.fraud_alert_threshold else "high_urgency"
        asyncio.create_task(trigger_n8n_alert(session_id, trigger, analysis))

    if tts_path and settings.audio_retention_seconds > 0:
        asyncio.create_task(_cleanup_file(tts_path, settings.audio_retention_seconds))

    return {
        "transcript": transcript,
        "response_text": response_text,
        "audio_bytes": tts_bytes,
        "audio_path": tts_path,
        "analysis": analysis,
    }


async def _cleanup_file(path: str, delay: int):
    await asyncio.sleep(delay)
    if os.path.exists(path):
        os.remove(path)


async def end_session(session_id: str):
    db = get_db()
    msgs = await db.messages.find({"session_id": session_id, "role": "user"}).to_list(length=500)
    if msgs:
        final_sentiment = msgs[-1].get("sentiment", "neutral")
    else:
        final_sentiment = "neutral"
    await db.voice_sessions.update_one(
        {"session_id": session_id},
        {"$set": {"status": "completed", "ended_at": datetime.now(timezone.utc), "final_sentiment": final_sentiment}},
    )
    return {"summary": "Session completed", "total_messages": len(msgs)}
