from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from database.mongo import get_database
from middleware.auth_middleware import get_current_admin
from services.whatsapp_service import whatsapp_service

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


@router.get("/whatsapp/webhook")
async def whatsapp_verify(
    hub_mode: str | None = Query(default=None, alias="hub.mode"),
    hub_verify_token: str | None = Query(default=None, alias="hub.verify_token"),
    hub_challenge: str | None = Query(default=None, alias="hub.challenge"),
):
    verified = whatsapp_service.verify_webhook(hub_mode, hub_verify_token, hub_challenge)
    if verified is None:
        raise HTTPException(status_code=403, detail="Verification failed")
    return int(verified)


@router.post("/whatsapp/webhook")
async def whatsapp_webhook(request: Request):
    payload = await request.json()
    await whatsapp_service.process_incoming(payload)
    return {"received": True}


@router.post("/crm/mock")
async def mock_crm(payload: dict):
    db = await get_database()
    ts = datetime.now(timezone.utc)
    await db.integration_logs.insert_one(
        {
            "integration": "crm",
            "direction": "outbound",
            "payload": payload,
            "status": "success",
            "timestamp": ts,
        }
    )
    return {"received": True, "logged_at": ts.isoformat()}


@router.get("/logs")
async def integration_logs(page: int = 1, limit: int = 20, _admin=Depends(get_current_admin)):
    db = await get_database()
    query = {}
    cursor = db.integration_logs.find(query).sort("timestamp", -1).skip((page - 1) * limit).limit(limit)
    items = await cursor.to_list(length=limit)
    for i in items:
        i["_id"] = str(i["_id"])
    total = await db.integration_logs.count_documents(query)
    return {"items": items, "total": total, "page": page, "limit": limit}
