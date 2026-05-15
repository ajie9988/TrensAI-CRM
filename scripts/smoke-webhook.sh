#!/bin/bash
set -euo pipefail

BACKEND_URL="${1:-http://localhost:8000}"
API_KEY="${API_KEY:-}"
DEVICE_ID="${DEVICE_ID:-1}"
PHONE="${PHONE:-628123456789}"

echo "TrensAI CRM Webhook Smoke Test"
echo "Backend: ${BACKEND_URL}"
echo "Device ID: ${DEVICE_ID}"

send_webhook() {
  local payload="$1"
  if [ -n "$API_KEY" ]; then
    curl -sS -X POST "${BACKEND_URL}/api/v1/webhooks/whatsapp" \
      -H "Content-Type: application/json" \
      -H "X-API-Key: ${API_KEY}" \
      -d "$payload"
  else
    curl -sS -X POST "${BACKEND_URL}/api/v1/webhooks/whatsapp" \
      -H "Content-Type: application/json" \
      -d "$payload"
  fi
}

echo "\n==> Send device.connected event"
send_webhook "{\"event\":\"device.connected\",\"device_id\":${DEVICE_ID},\"phone_number\":\"${PHONE}\",\"status\":\"connected\"}"

echo "\n==> Send incoming message event"
MSG_ID="smoke_$(date +%s%3N)"
TS="$(date +%s%3N)"
send_webhook "{\"device_id\":${DEVICE_ID},\"phone_number\":\"${PHONE}\",\"message_id\":\"${MSG_ID}\",\"content\":\"Smoke test message from scripts/smoke-webhook.sh\",\"type\":\"text\",\"direction\":\"incoming\",\"timestamp\":${TS}}"

echo "\nSmoke test completed."
