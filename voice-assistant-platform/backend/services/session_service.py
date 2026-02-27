import asyncio
import os
import time
from datetime import datetime, timezone
from pathlib import Path

from bson import ObjectId

from config import settings
from gml.memory_engine import memory_engine
from database.mongo import get_database
from models.emotion_service import emotion_service
from models.openrouter_service import SYSTEM_PROMPT, openrouter_service
from models.sentiment_service import sentiment_service
from models.tts_service import tts_service
from models.whisper_service import whisper_service
from services.fraud_service import fraud_service
from services.n8n_service import n8n_service
from services import urgency_service
from utils.helpers import generate_uuid
from utils.logger import get_logger

logger = get_logger("services.session")


class SessionService:
    async def create_session(self, user_id: str, channel: str) -> dict:
        db = await get_database()
        session_id = generate_uuid()
        payload = {
            "session_id": session_id,
            "user_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id,
            "channel": channel,
            "status": "active",
            "started_at": datetime.now(timezone.utc),
            "ended_at": None,
            "total_messages": 0,
            "final_sentiment": None,
            "peak_urgency_score": 0.0,
            "peak_fraud_score": 0.0,
            "escalation_required": False,
            "metadata": {},
        }
        await db.voice_sessions.insert_one(payload)
        return {"session_id": session_id, "websocket_url": f"/ws/audio/{session_id}"}

    async def process_audio_message(self, session_id: str, audio_bytes: bytes) -> dict:
        start_time = time.time()

        # Input validation for audio_bytes
        if not audio_bytes or len(audio_bytes) < 100:
            logger.warning("process_audio_aborted", reason="audio_too_short", size=len(audio_bytes))
            return {"error": "Audio data too short or empty", "transcript": ""}

        # Persist raw audio bytes for debugging/proof
        audio_filename = None
        audio_path = None
        audio_duration_estimate_s = 0.0
        try:
            # The browser is sending audio/webm;codecs=opus chunks, so this is not WAV.
            # Store as .webm so it can be inspected later.
            out_dir = Path(settings.AUDIO_STORAGE_PATH)
            out_dir.mkdir(parents=True, exist_ok=True)
            audio_filename = f"{session_id}-{int(time.time() * 1000)}.webm"
            audio_path = out_dir / audio_filename
            audio_path.write_bytes(audio_bytes)
            audio_duration_estimate_s = float(len(audio_bytes)) / 32000.0
            logger.info(
                "audio_saved",
                session_id=session_id,
                filename=audio_filename,
                bytes_len=len(audio_bytes),
                duration_estimate_s=audio_duration_estimate_s,
            )
        except Exception as exc:
            logger.warning("audio_save_failed", session_id=session_id, error=str(exc))

        transcription = await whisper_service.transcribe(audio_bytes)
        transcript = transcription.get("text", "")
        
        if not transcript.strip():
            # Check if there was an error in transcription result
            error_msg = transcription.get("error", "Could not transcribe audio")
            logger.warning("transcription_empty", session_id=session_id, error=error_msg)
            return {"error": error_msg, "transcript": ""}

        db = await get_database()
        history = await self.get_session_history(session_id)

        session_doc = await db.voice_sessions.find_one({"session_id": session_id})
        uid = str(session_doc.get("user_id")) if session_doc else None
        memory_context = ""
        if uid:
            try:
                memory_context = (await memory_engine.recall(db, uid, transcript, top_k=3)).get("memory_context", "")
            except Exception:
                memory_context = ""
        response_text = await openrouter_service.chat(transcript, await self._build_ollama_history(history), SYSTEM_PROMPT)

        sentiment_result = sentiment_service.analyze(transcript)
        urgency_score = urgency_service.score(transcript, sentiment_result)
        emotion_result = await emotion_service.analyze_audio(audio_bytes, transcript)
        
        # Pass audio features to fraud service for better detection
        audio_features = emotion_result.get("audio_features", {})
        fraud_result = fraud_service.evaluate(transcript, history, audio_features)

        audio_response_bytes = await tts_service.synthesize(response_text)

        analysis = {
            "sentiment": sentiment_result["sentiment"],
            "sentiment_score": sentiment_result["sentiment_score"],
            "label_scores": sentiment_result.get("label_scores", {}),
            "urgency_score": urgency_score,
            "urgency_label": urgency_service.get_urgency_label(urgency_score),
            "fraud_risk": fraud_result["fraud_risk"],
            "fraud_signals": fraud_result["fraud_signals"],
            "escalation_required": fraud_result["escalation_required"] or urgency_score > settings.URGENCY_ALERT_THRESHOLD,
            "emotion": emotion_result,
            "memory_context": memory_context,
        }

        message_id = await self._store_message(
            session_id=session_id,
            role="user",
            transcript=transcript,
            response=response_text,
            analysis=analysis,
            audio_path=str(audio_path) if audio_path else None,
        )

        await self._update_session_peaks(session_id, analysis)

        if analysis["escalation_required"]:
            trigger_reason = []
            if fraud_result["fraud_risk"] > settings.FRAUD_ALERT_THRESHOLD:
                trigger_reason.append("fraud_detected")
            if urgency_score > settings.URGENCY_ALERT_THRESHOLD:
                trigger_reason.append("high_urgency")
            if sentiment_result["sentiment"] == "negative" and sentiment_result["sentiment_score"] > 0.8:
                trigger_reason.append("negative_sentiment")
            asyncio.create_task(n8n_service.trigger_alert(session_id, trigger_reason, analysis, {"channel": "web"}))

        processing_time_ms = int((time.time() - start_time) * 1000)
        return {
            "message_id": str(message_id),
            "transcript": transcript,
            "response_text": response_text,
            "audio_bytes": audio_response_bytes,
            "analysis": analysis,
            "processing_time_ms": processing_time_ms,
            "transcription_meta": {
                "language": transcription.get("language"),
                "duration_seconds": transcription.get("duration_seconds"),
                "word_count": transcription.get("word_count"),
            },
        }

    async def process_text_message(self, session_id: str, text: str) -> dict:
        start_time = time.time()
        transcript = text
        db = await get_database()
        history = await self.get_session_history(session_id)
        session_doc = await db.voice_sessions.find_one({"session_id": session_id})
        uid = str(session_doc.get("user_id")) if session_doc else None
        memory_context = ""
        if uid:
            try:
                memory_context = (await memory_engine.recall(db, uid, transcript, top_k=3)).get("memory_context", "")
            except Exception:
                memory_context = ""
        response_text = await openrouter_service.chat(transcript, await self._build_ollama_history(history), SYSTEM_PROMPT)
        sentiment_result = sentiment_service.analyze(transcript)
        urgency_score = urgency_service.score(transcript, sentiment_result)
        fraud_result = fraud_service.evaluate(transcript, history)
        emotion_result = emotion_service._text_only_fallback(transcript)

        analysis = {
            "sentiment": sentiment_result["sentiment"],
            "sentiment_score": sentiment_result["sentiment_score"],
            "label_scores": sentiment_result.get("label_scores", {}),
            "urgency_score": urgency_score,
            "urgency_label": urgency_service.get_urgency_label(urgency_score),
            "fraud_risk": fraud_result["fraud_risk"],
            "fraud_signals": fraud_result["fraud_signals"],
            "escalation_required": fraud_result["escalation_required"] or urgency_score > settings.URGENCY_ALERT_THRESHOLD,
            "emotion": emotion_result,
            "memory_context": memory_context,
        }

        message_id = await self._store_message(session_id, "user", transcript, response_text, analysis, None)
        await self._update_session_peaks(session_id, analysis)

        if analysis["escalation_required"]:
            asyncio.create_task(n8n_service.trigger_alert(session_id, ["text_channel_escalation"], analysis, {"channel": "whatsapp"}))

        return {
            "message_id": str(message_id),
            "transcript": transcript,
            "response_text": response_text,
            "audio_bytes": None,
            "analysis": analysis,
            "processing_time_ms": int((time.time() - start_time) * 1000),
        }

    async def end_session(self, session_id: str) -> dict:
        db = await get_database()
        messages = await db.messages.find({"session_id": session_id, "role": "user"}).sort("timestamp", 1).to_list(length=500)
        final_sentiment = messages[-1]["sentiment"] if messages else "neutral"
        await db.voice_sessions.update_one(
            {"session_id": session_id},
            {"$set": {"status": "completed", "ended_at": datetime.now(timezone.utc), "final_sentiment": final_sentiment}},
        )

        session_doc = await db.voice_sessions.find_one({"session_id": session_id})
        user_id = str(session_doc.get("user_id")) if session_doc else None
        full_transcript = " ".join([m.get("transcript", "") for m in messages if m.get("transcript")])
        if full_transcript.strip() and user_id:
            asyncio.create_task(memory_engine.ingest_session(db, user_id, session_id, full_transcript))

        return {"summary": f"Session {session_id} completed", "total_messages": len(messages), "final_analysis": {"final_sentiment": final_sentiment}}

    async def get_session_history(self, session_id: str) -> list[dict]:
        db = await get_database()
        return await db.messages.find({"session_id": session_id}).sort("timestamp", 1).to_list(length=1000)

    async def _build_ollama_history(self, messages: list) -> list[dict]:
        history = []
        for msg in messages[-10:]:
            if msg.get("role") == "user" and msg.get("transcript"):
                history.append({"role": "user", "content": msg.get("transcript", "")})
            if msg.get("response"):
                history.append({"role": "assistant", "content": msg.get("response", "")})
            elif msg.get("role") == "assistant" and msg.get("transcript"):
                history.append({"role": "assistant", "content": msg.get("transcript", "")})
        return history[-20:]

    async def _store_message(self, session_id: str, role: str, transcript: str, response: str, analysis: dict, audio_path: str | None):
        db = await get_database()
        now = datetime.now(timezone.utc)
        user_doc = {
            "session_id": session_id,
            "role": role,
            "transcript": transcript,
            "response": response,
            "audio_path": audio_path,
            "sentiment": analysis["sentiment"],
            "sentiment_score": analysis["sentiment_score"],
            "urgency_score": analysis["urgency_score"],
            "fraud_risk": analysis["fraud_risk"],
            "fraud_signals": analysis.get("fraud_signals", []),
            "emotion": analysis.get("emotion"),
            "escalation_required": analysis["escalation_required"],
            "processing_time_ms": 0,
            "timestamp": now,
        }
        result = await db.messages.insert_one(user_doc)
        return result.inserted_id

    async def _update_session_peaks(self, session_id: str, analysis: dict):
        db = await get_database()
        update_doc = {
            "$max": {
                "peak_urgency_score": analysis["urgency_score"],
                "peak_fraud_score": analysis["fraud_risk"],
            },
            "$set": {"final_sentiment": analysis["sentiment"]},
            "$inc": {"total_messages": 1},
        }
        if analysis["escalation_required"]:
            update_doc["$set"].update({"escalation_required": True, "status": "escalated"})
        await db.voice_sessions.update_one({"session_id": session_id}, update_doc)


session_service = SessionService()
