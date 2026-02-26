from collections import Counter
from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends

from database.mongo import get_database
from middleware.auth_middleware import get_current_user
from models.emotion_service import emotion_service

router = APIRouter(prefix="/api/emotion", tags=["emotion"])


def _uid(user):
    uid = user.get("_id")
    return ObjectId(uid) if ObjectId.is_valid(str(uid)) else uid


@router.get("/session/{session_id}")
async def emotion_session(session_id: str, current_user=Depends(get_current_user)):
    db = await get_database()
    docs = await db.messages.find({"session_id": session_id, "emotion": {"$exists": True}}).sort("timestamp", 1).to_list(1000)
    return [
        {
            "timestamp": d.get("timestamp"),
            "dominant_emotion": d.get("emotion", {}).get("dominant_emotion"),
            "emotion_scores": d.get("emotion", {}).get("emotion_scores", {}),
            "audio_features": d.get("emotion", {}).get("audio_features", {}),
            "suggestion": d.get("emotion", {}).get("suggestion", ""),
        }
        for d in docs
    ]


@router.get("/trends")
async def emotion_trends(current_user=Depends(get_current_user)):
    db = await get_database()
    user_id = _uid(current_user)
    week_ago = datetime.utcnow() - timedelta(days=7)
    sessions = await db.voice_sessions.find({"user_id": user_id, "started_at": {"$gte": week_ago}}).to_list(500)
    session_ids = [s.get("session_id") for s in sessions]
    messages = await db.messages.find({"session_id": {"$in": session_ids}, "emotion": {"$exists": True}}).to_list(5000)

    emotion_counter = Counter()
    stress_scores = []
    suggestions = Counter()
    trend_7d = {}
    for msg in messages:
        e = msg.get("emotion", {})
        dom = e.get("dominant_emotion")
        if dom:
            emotion_counter[dom] += 1
        stress_scores.append(e.get("emotion_scores", {}).get("stressed", 0.0))
        if e.get("suggestion"):
            suggestions[e["suggestion"]] += 1
        day = msg.get("timestamp").strftime("%Y-%m-%d") if msg.get("timestamp") else "unknown"
        trend_7d.setdefault(day, Counter())
        if dom:
            trend_7d[day][dom] += 1

    most_common = emotion_counter.most_common(1)[0][0] if emotion_counter else "calm"
    return {
        "emotion_distribution": dict(emotion_counter),
        "avg_stress_score": round(sum(stress_scores) / len(stress_scores), 3) if stress_scores else 0.0,
        "most_common_emotion": most_common,
        "trend_7d": [{"date": d, **dict(c)} for d, c in sorted(trend_7d.items())],
        "common_suggestions": [{"suggestion": s, "count": c} for s, c in suggestions.most_common(5)],
    }


@router.post("/analyze-text")
async def analyze_text(payload: dict, current_user=Depends(get_current_user)):
    text = payload.get("text", "")
    return emotion_service._text_only_fallback(text)
