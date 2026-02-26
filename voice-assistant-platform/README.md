# AI Voice Assistant Platform

## Architecture (ASCII)
```
┌───────────────┐    WebRTC/WebSocket/REST    ┌─────────────────────────┐
│ React Frontend│ ───────────────────────────▶ │ FastAPI Backend         │
│ (Vite + Nginx)│ ◀─────────────────────────── │ Auth/Voice/Analytics    │
└───────────────┘                               │ Integrations/Health     │
                                                ├───────────┬────────────┤
                                                │ MongoDB   │ Ollama     │
                                                │ (Motor)   │ (Llama3)   │
                                                ├───────────┼────────────┤
                                                │ Whisper   │ Coqui TTS  │
                                                │ STT       │ Speech      │
                                                └───────────┴────────────┘
                                                             │
                                                     WhatsApp / n8n
```

## Prerequisites
- Docker + Docker Compose
- 8GB+ RAM recommended for local models
- Optional: Meta WhatsApp credentials
- Optional: HuggingFace token

## Quick start
```bash
git clone <repo-url>
cd voice-assistant-platform
cp .env.example .env
# edit .env values
docker-compose up --build
```
Open:
- Frontend: http://localhost:3000
- Backend docs: http://localhost:8000/docs

## First-time admin setup
Default admin is auto-created from `.env`:
- `DEFAULT_ADMIN_USERNAME`
- `DEFAULT_ADMIN_PASSWORD`

Manual register flow (admin-only endpoint):
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Authorization: Bearer <admin_access_token>" \
  -H "Content-Type: application/json" \
  -d '{"username":"agent1","email":"agent1@example.com","password":"StrongPass123!","role":"agent"}'
```

## API walkthrough (examples)
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}'

# Refresh token
curl -X POST http://localhost:8000/api/auth/refresh -H 'Content-Type: application/json' \
  -d '{"refresh_token":"<refresh-token>"}'

# Health
curl http://localhost:8000/api/health

# Start voice session
curl -X POST http://localhost:8000/api/voice/start-session \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"channel":"web"}'

# End session
curl -X POST http://localhost:8000/api/voice/end-session \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"session_id":"<session-id>"}'
```

## WhatsApp Cloud API setup
1. Create a Meta app and add WhatsApp product.
2. Generate permanent access token and phone number id.
3. Set in `.env`: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`.
4. Configure callback URL: `https://<your-host>/api/integrations/whatsapp/webhook`.
5. Verify webhook token and subscribe to message events.

## n8n integration
1. Create webhook workflow in n8n.
2. Copy webhook URL.
3. Set `N8N_WEBHOOK_URL` in `.env`.
4. Fraud/urgency alerts auto-post with retries.

## Troubleshooting (10 common issues)
1. **Ollama unavailable**: check `ollama` container logs and model pull status.
2. **Whisper OOM**: switch `WHISPER_MODEL_SIZE=tiny` and raise Docker memory.
3. **TTS load error**: verify `TTS_MODEL` name and backend image build logs.
4. **Mongo connect failures**: confirm `MONGODB_URI` and `mongodb` healthcheck.
5. **401 errors after login**: inspect access token expiry; test refresh endpoint.
6. **WebSocket disconnects**: verify reverse-proxy upgrade headers.
7. **No microphone data**: browser mic permission and HTTPS in production.
8. **WhatsApp 503**: missing env vars; endpoint intentionally returns not configured.
9. **n8n not receiving events**: ensure webhook URL reachable from backend network.
10. **Frontend blank screen**: run `npm run build` locally and inspect console errors.

## Environment variables reference
| Variable | Required | Purpose |
|---|---:|---|
| MONGODB_URI | Yes | MongoDB connection URI |
| JWT_SECRET_KEY | Yes | JWT signing key |
| JWT_ALGORITHM | Yes | JWT algorithm |
| ACCESS_TOKEN_EXPIRE_MINUTES | Yes | Access token TTL |
| REFRESH_TOKEN_EXPIRE_DAYS | Yes | Refresh token TTL |
| WHISPER_MODEL_SIZE | Yes | Local Whisper model size |
| OLLAMA_HOST | Yes | Ollama server URL |
| OLLAMA_MODEL | Yes | Ollama model name |
| TTS_MODEL | Yes | Coqui TTS model |
| HUGGINGFACE_TOKEN | No | HF token for sentiment model |
| WHATSAPP_TOKEN | No | WhatsApp Graph API token |
| WHATSAPP_PHONE_NUMBER_ID | No | WhatsApp sender id |
| WHATSAPP_VERIFY_TOKEN | No | WhatsApp webhook verify token |
| N8N_WEBHOOK_URL | No | n8n alert webhook |
| CORS_ORIGINS | Yes | Allowed origins, comma-separated |
| FRAUD_ALERT_THRESHOLD | Yes | Fraud escalation threshold |
| URGENCY_ALERT_THRESHOLD | Yes | Urgency escalation threshold |
| AUDIO_STORAGE_PATH | Yes | Local audio output path |
| LOG_LEVEL | Yes | Logging level |
| DEBUG | Yes | Debug mode |


## Resolving merge conflicts with `main`

If your merge against `main` stops with conflicts in the backend/platform files, run:

```bash
git merge main
./voice-assistant-platform/scripts/resolve_main_conflicts.sh
```

This helper resolves the known conflict set by preferring the current branch content (`--ours`) and stages the files so you can finish with `git commit`.

