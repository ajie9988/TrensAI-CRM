# Smoke Test Guide

This guide validates the most critical WhatsApp ingestion path:

wa-engine -> backend webhook -> database write path.

## Prerequisites

- Backend running and reachable (default: http://localhost:8000)
- At least one device record exists in database (default script uses device_id=1)
- Optional API key if webhook protection is enabled

## Option A (Windows PowerShell)

Run:

```powershell
./scripts/smoke-webhook.ps1 -BackendUrl http://localhost:8000 -DeviceId 1 -Phone 628123456789
```

With API key:

```powershell
./scripts/smoke-webhook.ps1 -BackendUrl http://localhost:8000 -ApiKey "your-key" -DeviceId 1 -Phone 628123456789
```

## Option B (bash)

Run:

```bash
bash ./scripts/smoke-webhook.sh http://localhost:8000
```

With API key:

```bash
API_KEY=your-key DEVICE_ID=1 PHONE=628123456789 bash ./scripts/smoke-webhook.sh http://localhost:8000
```

## Expected Results

- First request (device.connected) returns status ok/event response.
- Second request (incoming message) returns status received with message_id.
- New records should exist in:
  - contacts
  - conversations
  - messages

## Quick Verification SQL

```sql
SELECT id, phone_number, name, created_at FROM contacts ORDER BY id DESC LIMIT 5;
SELECT id, conversation_id, tenant_id, device_id, contact_id, status, unread_count, last_message_at FROM conversations ORDER BY id DESC LIMIT 5;
SELECT id, message_id, tenant_id, device_id, contact_id, direction, type, status, content, created_at FROM messages ORDER BY id DESC LIMIT 5;
```

## Troubleshooting

- 404 Unknown device: ensure device_id exists.
- 422 device_id and phone_number required: payload is malformed.
- 500 errors: inspect backend logs and queue worker logs.
- Duplicate message_id error: rerun (script uses timestamp-based unique IDs).
