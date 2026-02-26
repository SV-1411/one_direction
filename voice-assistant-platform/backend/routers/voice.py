from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from database.schemas import EndSessionRequest, StartSessionRequest
from middleware.auth_middleware import get_current_user
from services.session_service import session_service
from database.mongo import get_database
from config import settings

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.post("/start-session")
async def start_session(payload: StartSessionRequest, current_user=Depends(get_current_user)):
    return await session_service.create_session(str(current_user["_id"]), payload.channel)


@router.post("/process-audio")
async def process_audio(session_id: str = Form(...), audio_file: UploadFile = File(...), current_user=Depends(get_current_user)):
    audio_bytes = await audio_file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="audio file empty")
    return await session_service.process_audio_message(session_id, audio_bytes)


@router.post("/end-session")
async def end_session(payload: EndSessionRequest, current_user=Depends(get_current_user)):
    return await session_service.end_session(payload.session_id)


@router.get("/sessions")
async def list_sessions(page: int = 1, limit: int = 20, current_user=Depends(get_current_user)):
    db = await get_database()
    q = {"user_id": current_user["_id"]}
    total = await db.voice_sessions.count_documents(q)
    items = await db.voice_sessions.find(q).sort("started_at", -1).skip((page - 1) * limit).limit(limit).to_list(length=limit)
    for item in items:
        item["_id"] = str(item["_id"])
        if hasattr(item.get("user_id"), "__str__"):
            item["user_id"] = str(item["user_id"])
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.get("/audio/{filename}")
async def get_audio(filename: str, current_user=Depends(get_current_user)):
    path = Path(settings.AUDIO_STORAGE_PATH) / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="audio file not found")
    return FileResponse(path=str(path), media_type="audio/wav")
