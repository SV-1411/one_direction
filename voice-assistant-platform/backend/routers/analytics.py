from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from middleware.auth_middleware import get_current_user
from database.mongo import get_db

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/dashboard")
async def dashboard(user=Depends(get_current_user)):
    db = get_db()
    total = await db.voice_sessions.count_documents({})
    active = await db.voice_sessions.count_documents({"status": "active"})
    fraud_alerts = await db.voice_sessions.count_documents({"peak_fraud_score": {"$gt": 0.7}})
    msgs = await db.messages.find({"role": "user"}).to_list(length=500)
    avg_sent = round(sum(m.get("sentiment_score", 0) for m in msgs) / max(len(msgs), 1), 4)
    return {
        "total_sessions": total,
        "active_sessions": active,
        "avg_sentiment": avg_sent,
        "fraud_alerts_today": fraud_alerts,
        "urgency_distribution": {"low": 0, "medium": 0, "high": 0},
        "sentiment_trend_7d": [],
    }


@router.get("/session/{session_id}")
async def session_detail(session_id: str, user=Depends(get_current_user)):
    db = get_db()
    session = await db.voice_sessions.find_one({"session_id": session_id})
    messages = await db.messages.find({"session_id": session_id}).to_list(length=500)
    return {"session": session, "messages": messages}


@router.get("/sessions")
async def sessions(page: int = 1, limit: int = 20, sentiment: str | None = None, escalation: bool | None = None, channel: str | None = None, user=Depends(get_current_user)):
    db = get_db()
    query = {}
    if escalation is not None:
        query["escalation_required"] = escalation
    if channel:
        query["channel"] = channel
    docs = await db.voice_sessions.find(query).skip((page - 1) * limit).limit(limit).to_list(length=limit)
    return {"items": docs, "page": page, "limit": limit}


@router.get("/fraud-alerts")
async def fraud_alerts(page: int = 1, limit: int = 20, user=Depends(get_current_user)):
    db = get_db()
    docs = await db.voice_sessions.find({"peak_fraud_score": {"$gt": 0.7}}).skip((page - 1) * limit).limit(limit).to_list(length=limit)
    return {"items": docs, "page": page, "limit": limit}
