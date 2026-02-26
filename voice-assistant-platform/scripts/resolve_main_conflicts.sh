#!/usr/bin/env bash
set -euo pipefail

# Resolve known merge conflicts for this repository.
# Default strategy is --ours (keep current branch content).
# Usage:
#   ./voice-assistant-platform/scripts/resolve_main_conflicts.sh
#   ./voice-assistant-platform/scripts/resolve_main_conflicts.sh --theirs

STRATEGY="--ours"
if [[ "${1:-}" == "--theirs" ]]; then
  STRATEGY="--theirs"
elif [[ "${1:-}" == "--ours" || -z "${1:-}" ]]; then
  STRATEGY="--ours"
else
  echo "Unknown option: ${1:-}"
  echo "Use --ours (default) or --theirs"
  exit 64
fi

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$REPO_ROOT" ]]; then
  echo "Not inside a git repository."
  exit 1
fi

cd "$REPO_ROOT"

if ! git rev-parse -q --verify MERGE_HEAD >/dev/null; then
  echo "No merge in progress. Start merge first (for example: git merge main)."
  exit 1
fi

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

resolved_count=0
for file in "${FILES[@]}"; do
  if git ls-files -u -- "$file" | grep -q .; then
    git checkout "$STRATEGY" -- "$file"
    git add "$file"
    printf 'Resolved with %s: %s\n' "$STRATEGY" "$file"
    resolved_count=$((resolved_count + 1))
  fi
done

if git ls-files -u | grep -q .; then
  echo "Some conflicts still remain (possibly outside the known file list)."
  echo "Run: git status"
  exit 2
fi

echo "Resolved files: $resolved_count"
echo "All merge conflicts are resolved and staged."
echo "Now run tests, then finalize merge with: git commit"
