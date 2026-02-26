#!/usr/bin/env bash
set -euo pipefail

# Resolve known merge conflicts by preferring the current branch (work) content.
# Run this script only while a merge is in progress.

FILES=(
  "voice-assistant-platform/.env.example"
  "voice-assistant-platform/README.md"
  "voice-assistant-platform/backend/Dockerfile"
  "voice-assistant-platform/backend/config.py"
  "voice-assistant-platform/backend/database/mongo.py"
  "voice-assistant-platform/backend/database/schemas.py"
  "voice-assistant-platform/backend/main.py"
  "voice-assistant-platform/backend/middleware/auth_middleware.py"
  "voice-assistant-platform/backend/middleware/cors.py"
  "voice-assistant-platform/backend/middleware/rate_limiter.py"
  "voice-assistant-platform/backend/models/model_manager.py"
  "voice-assistant-platform/backend/models/ollama_service.py"
  "voice-assistant-platform/backend/models/sentiment_service.py"
  "voice-assistant-platform/backend/models/tts_service.py"
  "voice-assistant-platform/backend/models/whisper_service.py"
  "voice-assistant-platform/backend/requirements.txt"
  "voice-assistant-platform/backend/routers/analytics.py"
  "voice-assistant-platform/backend/routers/auth.py"
  "voice-assistant-platform/backend/routers/health.py"
  "voice-assistant-platform/backend/routers/integrations.py"
  "voice-assistant-platform/backend/routers/voice.py"
  "voice-assistant-platform/backend/services/fraud_service.py"
  "voice-assistant-platform/backend/services/n8n_service.py"
  "voice-assistant-platform/backend/services/session_service.py"
  "voice-assistant-platform/backend/services/urgency_service.py"
)

if ! git rev-parse -q --verify MERGE_HEAD >/dev/null; then
  echo "No merge in progress. Start merge first (for example: git merge main)."
  exit 1
fi

for file in "${FILES[@]}"; do
  if git ls-files -u -- "$file" | grep -q .; then
    git checkout --ours -- "$file"
    git add "$file"
    echo "Resolved with --ours: $file"
  fi
done

if git ls-files -u | grep -q .; then
  echo "Some conflicts still remain. Run: git status"
  exit 2
fi

echo "All tracked conflict files resolved."
echo "Now run tests, then finalize merge with: git commit"
