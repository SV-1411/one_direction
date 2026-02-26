#!/usr/bin/env bash
set -euo pipefail

# Resolve merge conflicts for this repository.
# Default strategy is --ours (keep current branch content).
#
# Why conflicts can remain:
# - GitHub/main may introduce additional conflicted files that are not in the historical
#   fixed file list. Earlier versions of this script only resolved that known list.
#
# This version resolves the known list first, then (by default) resolves ANY remaining
# unmerged files with the same strategy so merges can complete in one pass.
#
# Usage:
#   ./voice-assistant-platform/scripts/resolve_main_conflicts.sh
#   ./voice-assistant-platform/scripts/resolve_main_conflicts.sh --theirs
#   ./voice-assistant-platform/scripts/resolve_main_conflicts.sh --ours --known-only

STRATEGY="--ours"
KNOWN_ONLY=0

for arg in "$@"; do
  case "$arg" in
    --ours) STRATEGY="--ours" ;;
    --theirs) STRATEGY="--theirs" ;;
    --known-only) KNOWN_ONLY=1 ;;
    *)
      echo "Unknown option: $arg"
      echo "Use: --ours | --theirs | --known-only"
      exit 64
      ;;
  esac
done

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

KNOWN_FILES=(
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

resolved_known=0
for file in "${KNOWN_FILES[@]}"; do
  if git ls-files -u -- "$file" | grep -q .; then
    git checkout "$STRATEGY" -- "$file"
    git add "$file"
    printf 'Resolved known file with %s: %s\n' "$STRATEGY" "$file"
    resolved_known=$((resolved_known + 1))
  fi
done

resolved_extra=0
if [[ "$KNOWN_ONLY" -eq 0 ]]; then
  # Resolve all remaining conflicted paths (root cause fix for list drift).
  while IFS= read -r path; do
    [[ -z "$path" ]] && continue
    git checkout "$STRATEGY" -- "$path"
    git add "$path"
    printf 'Resolved extra file with %s: %s\n' "$STRATEGY" "$path"
    resolved_extra=$((resolved_extra + 1))
  done < <(git diff --name-only --diff-filter=U)
fi

if git ls-files -u | grep -q .; then
  echo "Some conflicts still remain."
  echo "Run: git status"
  exit 2
fi

echo "Resolved known files: $resolved_known"
echo "Resolved extra files: $resolved_extra"
echo "All merge conflicts are resolved and staged."
echo "Now run tests, then finalize merge with: git commit"
