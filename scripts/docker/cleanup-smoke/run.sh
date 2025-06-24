#!/usr/bin/env bash
set -euo pipefail

cd /repo

export OPIN_STATE_DIR="/tmp/opin-test"
export OPIN_CONFIG_PATH="${OPIN_STATE_DIR}/opin.json"

echo "==> Build"
pnpm build

echo "==> Seed state"
mkdir -p "${OPIN_STATE_DIR}/credentials"
mkdir -p "${OPIN_STATE_DIR}/agents/main/sessions"
echo '{}' >"${OPIN_CONFIG_PATH}"
echo 'creds' >"${OPIN_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${OPIN_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
pnpm opin reset --scope config+creds+sessions --yes --non-interactive

test ! -f "${OPIN_CONFIG_PATH}"
test ! -d "${OPIN_STATE_DIR}/credentials"
test ! -d "${OPIN_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${OPIN_STATE_DIR}/credentials"
echo '{}' >"${OPIN_CONFIG_PATH}"

echo "==> Uninstall (state only)"
pnpm opin uninstall --state --yes --non-interactive

test ! -d "${OPIN_STATE_DIR}"

echo "OK"
