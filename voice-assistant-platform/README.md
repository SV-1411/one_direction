# AI Voice Assistant Platform

## Architecture
```
Browser/WebRTC -> FastAPI (WS/REST) -> AI Pipeline (Whisper/Ollama/Sentiment/TTS) -> MongoDB
                                          |-> WhatsApp Cloud API
                                          |-> n8n alerts
```

## Prerequisites
- Docker + Docker Compose
- Meta WhatsApp app (optional)
- HuggingFace token (optional)

## Quick Start
1. `cp .env.example .env`
2. Fill desired credentials.
3. `docker-compose up --build`
4. Frontend: http://localhost:3000, Backend: http://localhost:8000/docs

## Create first admin user
- Start app, then run:
`curl -X POST http://localhost:8000/api/auth/register -H 'Authorization: Bearer <admin-token>' -H 'Content-Type: application/json' -d '{"username":"admin2","email":"admin2@example.com","password":"StrongPass1!","role":"admin"}'`

## End-to-end voice test
1. Login via `/login`.
2. Open Voice Session and click mic.
3. Speak, then stop recording.
4. Watch transcript, response text, sentiment/fraud/urgency.

## WhatsApp webhook setup
- Set `WHATSAPP_*` values in `.env`.
- In Meta Developer Console set callback URL to `https://<host>/api/integrations/whatsapp/webhook` and verify token to `.env` value.

## n8n setup
- Set `N8N_WEBHOOK_URL` in `.env` to your workflow webhook endpoint.
- Alerts are sent for fraud/urgency thresholds.

## API curl examples
- Login: `curl -X POST http://localhost:8000/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin"}'`
- Health: `curl http://localhost:8000/api/health`
- Start session: `curl -X POST http://localhost:8000/api/voice/start-session -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{"channel":"web"}'`

## Troubleshooting
- Ollama not loading: confirm `ollama` container pulled model and `OLLAMA_HOST` is reachable.
- Whisper OOM: reduce model size (`tiny`) and increase Docker memory.
- Coqui TTS errors: verify `ffmpeg/libsndfile` present and model name valid.
- MongoDB issues: check `MONGODB_URI` and `mongodb` container health.
- Microphone issues: ensure browser permission for mic and HTTPS in production.
