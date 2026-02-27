from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends

from config import settings
from database.mongo import get_database
from middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _oid(user):
    uid = user.get("_id")
    return ObjectId(uid) if ObjectId.is_valid(str(uid)) else uid


def format_sentiment_trend(rows):
    out = {}
    for row in rows:
        key = row["date"].strftime("%Y-%m-%d")
        out.setdefault(key, {"date": key, "positive": 0, "neutral": 0, "negative": 0})
        sentiment = row["_id"].get("sentiment") or "neutral"
        out[key][sentiment if sentiment in out[key] else "neutral"] = row["count"]
    return list(out.values())


def format_volume(rows):
    out = {}
    for row in rows:
        d = row["_id"]["day"]
        out.setdefault(d, {"date": d, "web": 0, "whatsapp": 0})
        out[d][row["_id"].get("channel", "web")] = row["count"]
    return list(out.values())


@router.get("/dashboard")
async def get_dashboard(current_user=Depends(get_current_user)):
    db = await get_database()
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    sessions_col = db["voice_sessions"]

    user_id = _oid(current_user)

    try:
        total_sessions = await sessions_col.count_documents({"user_id": user_id})
        active_sessions = await sessions_col.count_documents({"user_id": user_id, "status": "active"})
        sessions_today = await sessions_col.count_documents({"user_id": user_id, "started_at": {"$gte": today_start}})
        fraud_alerts_today = await sessions_col.count_documents(
            {"user_id": user_id, "peak_fraud_score": {"$gt": settings.FRAUD_ALERT_THRESHOLD}, "started_at": {"$gte": today_start}}
        )
        escalations_today = await sessions_col.count_documents({"user_id": user_id, "escalation_required": True, "started_at": {"$gte": today_start}})

        sentiment_pipeline = [
            {"$match": {"user_id": user_id, "started_at": {"$gte": week_ago}}},
            {
                "$group": {
                    "_id": {"day": {"$dayOfYear": "$started_at"}, "year": {"$year": "$started_at"}, "sentiment": "$final_sentiment"},
                    "count": {"$sum": 1},
                    "date": {"$first": "$started_at"},
                }
            },
            {"$sort": {"date": 1}},
        ]
        sentiment_trend_raw = await sessions_col.aggregate(sentiment_pipeline).to_list(100)

        volume_pipeline = [
            {"$match": {"user_id": user_id, "started_at": {"$gte": week_ago}}},
            {"$group": {"_id": {"day": {"$dateToString": {"format": "%Y-%m-%d", "date": "$started_at"}}, "channel": "$channel"}, "count": {"$sum": 1}}},
            {"$sort": {"_id.day": 1}},
        ]
        volume_raw = await sessions_col.aggregate(volume_pipeline).to_list(100)

        urgency_pipeline = [
            {"$match": {"user_id": user_id}},
            {"$bucket": {"groupBy": "$peak_urgency_score", "boundaries": [0, 0.25, 0.5, 0.75, 1.01], "default": "unknown", "output": {"count": {"$sum": 1}}}},
        ]
        urgency_dist = await sessions_col.aggregate(urgency_pipeline).to_list(10)

        # Sanitize data for JSON response
        sentiment_trend = format_sentiment_trend(sentiment_trend_raw)
        session_volume = format_volume(volume_raw)

        return {
            "total_sessions": total_sessions,
            "active_sessions": active_sessions,
            "sessions_today": sessions_today,
            "fraud_alerts_today": fraud_alerts_today,
            "escalations_today": escalations_today,
            "sentiment_trend": sentiment_trend,
            "session_volume": session_volume,
            "urgency_distribution": {
                "low": next((b["count"] for b in urgency_dist if b["_id"] == 0), 0),
                "medium": next((b["count"] for b in urgency_dist if b["_id"] == 0.25), 0),
                "high": next((b["count"] for b in urgency_dist if b["_id"] == 0.5), 0),
                "critical": next((b["count"] for b in urgency_dist if b["_id"] == 0.75), 0),
            },
        }
    except Exception as e:
        logger.error(f"get_dashboard_failed: {str(e)}", exc_info=True)
        return {
            "total_sessions": 0, "active_sessions": 0, "sessions_today": 0,
            "fraud_alerts_today": 0, "escalations_today": 0,
            "sentiment_trend": [], "session_volume": [],
            "urgency_distribution": {"low": 0, "medium": 0, "high": 0, "critical": 0},
            "error": str(e)
        }


@router.get("/session/{session_id}")
async def get_session(session_id: str, current_user=Depends(get_current_user)):
    try:
        db = await get_database()
        session = await db.voice_sessions.find_one({"session_id": session_id})
        messages = await db.messages.find({"session_id": session_id}).sort("timestamp", 1).to_list(1000)
        if session and "_id" in session:
            session["_id"] = str(session["_id"])
            if "user_id" in session:
                session["user_id"] = str(session["user_id"])
        for m in messages:
            m["_id"] = str(m["_id"])
            if "user_id" in m:
                m["user_id"] = str(m["user_id"])
        return {"session": session, "messages": messages}
    except Exception as e:
        logger.error(f"get_session_failed: {str(e)}", exc_info=True)
        return {"session": None, "messages": [], "error": str(e)}


@router.get("/sessions")
async def list_sessions(
    page: int = 1,
    pageSize: int = 20,
    startDate: str | None = None,
    endDate: str | None = None,
    sentiment: str | None = None,
    escalation: str | None = None,
    channel: str | None = None,
    current_user=Depends(get_current_user),
):
    db = await get_database()
    query = {"user_id": _oid(current_user)}
    if channel:
        query["channel"] = channel
    if escalation in {"true", "false"}:
        query["escalation_required"] = escalation == "true"
    if startDate or endDate:
        query["started_at"] = {}
        if startDate:
            query["started_at"]["$gte"] = datetime.fromisoformat(startDate)
        if endDate:
            query["started_at"]["$lte"] = datetime.fromisoformat(endDate)

    try:
        cursor = db.voice_sessions.find(query).sort("started_at", -1).skip((page - 1) * pageSize).limit(pageSize)
        items = await cursor.to_list(pageSize)

        if sentiment:
            session_ids = [i["session_id"] for i in items]
            if session_ids:
                allowed_messages = await db.messages.find({"session_id": {"$in": session_ids}, "sentiment": sentiment}).to_list(5000)
                allowed = {m["session_id"] for m in allowed_messages}
                items = [i for i in items if i["session_id"] in allowed]
            else:
                items = []

        for item in items:
            if "_id" in item:
                item["_id"] = str(item["_id"])
            if "user_id" in item:
                item["user_id"] = str(item["user_id"])
        
        total = await db.voice_sessions.count_documents(query)
        return {"items": items, "total": total, "page": page, "pageSize": pageSize}
    except Exception as e:
        import traceback
        logger.error(f"list_sessions_failed: {str(e)}", exc_info=True)
        return {"items": [], "total": 0, "page": page, "pageSize": pageSize, "error": str(e)}


@router.get("/fraud-alerts")
async def fraud_alerts(page: int = 1, pageSize: int = 20, current_user=Depends(get_current_user)):
    db = await get_database()
    query = {"user_id": _oid(current_user), "peak_fraud_score": {"$gt": settings.FRAUD_ALERT_THRESHOLD}}
    items = await db.voice_sessions.find(query).sort("started_at", -1).skip((page - 1) * pageSize).limit(pageSize).to_list(pageSize)
    for item in items:
        item["_id"] = str(item["_id"])
    total = await db.voice_sessions.count_documents(query)
    return {"items": items, "total": total, "page": page, "pageSize": pageSize}
