#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_NAME="${OPIN_IMAGE:-${OPIN_IMAGE:-${OPIN_IMAGE:-opin:local}}}"
CONFIG_DIR="${OPIN_CONFIG_DIR:-${OPIN_CONFIG_DIR:-${OPIN_CONFIG_DIR:-$HOME/.opin}}}"
WORKSPACE_DIR="${OPIN_WORKSPACE_DIR:-${OPIN_WORKSPACE_DIR:-${OPIN_WORKSPACE_DIR:-$HOME/.opin/workspace}}}"
PROFILE_FILE="${OPIN_PROFILE_FILE:-${OPIN_PROFILE_FILE:-${OPIN_PROFILE_FILE:-$HOME/.profile}}}"
LIVE_MODELS="${OPIN_LIVE_MODELS:-${OPIN_LIVE_MODELS:-${OPIN_LIVE_MODELS:-all}}}"
LIVE_PROVIDERS="${OPIN_LIVE_PROVIDERS:-${OPIN_LIVE_PROVIDERS:-${OPIN_LIVE_PROVIDERS:-}}}"
LIVE_TIMEOUT_MS="${OPIN_LIVE_MODEL_TIMEOUT_MS:-${OPIN_LIVE_MODEL_TIMEOUT_MS:-${OPIN_LIVE_MODEL_TIMEOUT_MS:-}}}"
LIVE_REQUIRE_PROFILE_KEYS="${OPIN_LIVE_REQUIRE_PROFILE_KEYS:-${OPIN_LIVE_REQUIRE_PROFILE_KEYS:-${OPIN_LIVE_REQUIRE_PROFILE_KEYS:-}}}"

PROFILE_MOUNT=()
if [[ -f "$PROFILE_FILE" ]]; then
  PROFILE_MOUNT=(-v "$PROFILE_FILE":/home/node/.profile:ro)
fi

echo "==> Build image: $IMAGE_NAME"
docker build -t "$IMAGE_NAME" -f "$ROOT_DIR/Dockerfile" "$ROOT_DIR"

echo "==> Run live model tests (profile keys)"
docker run --rm -t \
  --entrypoint bash \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  -e HOME=/home/node \
  -e NODE_OPTIONS=--disable-warning=ExperimentalWarning \
  -e OPIN_LIVE_TEST=1 \
  -e OPIN_LIVE_TEST=1 \
  -e OPIN_LIVE_MODELS="$LIVE_MODELS" \
  -e OPIN_LIVE_MODELS="$LIVE_MODELS" \
  -e OPIN_LIVE_PROVIDERS="$LIVE_PROVIDERS" \
  -e OPIN_LIVE_PROVIDERS="$LIVE_PROVIDERS" \
  -e OPIN_LIVE_MODEL_TIMEOUT_MS="$LIVE_TIMEOUT_MS" \
  -e OPIN_LIVE_MODEL_TIMEOUT_MS="$LIVE_TIMEOUT_MS" \
  -e OPIN_LIVE_REQUIRE_PROFILE_KEYS="$LIVE_REQUIRE_PROFILE_KEYS" \
  -e OPIN_LIVE_REQUIRE_PROFILE_KEYS="$LIVE_REQUIRE_PROFILE_KEYS" \
  -v "$CONFIG_DIR":/home/node/.opin \
  -v "$WORKSPACE_DIR":/home/node/.opin/workspace \
  "${PROFILE_MOUNT[@]}" \
  "$IMAGE_NAME" \
  -lc "set -euo pipefail; [ -f \"$HOME/.profile\" ] && source \"$HOME/.profile\" || true; cd /app && pnpm test:live"
