from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse

from middleware.auth_middleware import get_current_user
from middleware.rate_limiter import get_client_ip, limiter
from services.session_service import end_session, process_audio_file, start_session
from database.schemas import EndSessionRequest, StartSessionRequest

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.post("/start-session")
async def start(payload: StartSessionRequest, user=Depends(get_current_user)):
    sid = await start_session(str(user["_id"]), payload.channel)
    return {"session_id": sid, "websocket_url": f"/ws/audio/{sid}"}


@router.post("/process-audio")
async def process(request: Request, session_id: str = Form(...), audio_file: UploadFile = File(...), user=Depends(get_current_user)):
    limiter.check(f"voice:{get_client_ip(request)}", 10, 60)
    content = await audio_file.read()
    try:
        result = await process_audio_file(session_id, content)
    except RuntimeError as exc:
        code = str(exc)
        mapping = {
            "WHISPER_UNAVAILABLE": "Integration not configured. Set WHISPER_MODEL_SIZE in .env",
            "OLLAMA_UNAVAILABLE": "Integration not configured. Set OLLAMA_HOST in .env",
        }
        raise HTTPException(status_code=503, detail=mapping.get(code, code))
    audio_url = f"/api/voice/audio/{result['audio_path'].split('/')[-1]}" if result["audio_path"] else None
    return {"transcript": result["transcript"], "response_text": result["response_text"], "audio_url": audio_url, "analysis": result["analysis"]}


@router.get("/audio/{file_name}")
async def audio(file_name: str, user=Depends(get_current_user)):
    return FileResponse(path=f"./audio_storage/{file_name}", media_type="audio/wav")


@router.post("/end-session")
async def end(payload: EndSessionRequest, user=Depends(get_current_user)):
    summary = await end_session(payload.session_id)
    return {**summary, "final_analysis": {}}
