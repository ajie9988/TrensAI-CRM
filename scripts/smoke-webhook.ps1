param(
  [string]$BackendUrl = "http://localhost:8000",
  [string]$ApiKey = "",
  [int]$DeviceId = 1,
  [string]$Phone = "628123456789"
)

$ErrorActionPreference = "Stop"

$BackendUrl = $BackendUrl.TrimEnd('/')

function Write-Step($text) {
  Write-Host "`n==> $text" -ForegroundColor Cyan
}

function Invoke-Webhook($payload) {
  $headers = @{ "Content-Type" = "application/json" }
  if ($ApiKey -ne "") {
    $headers["X-API-Key"] = $ApiKey
  }

  $uri = "{0}/api/v1/webhooks/whatsapp" -f $BackendUrl

  return Invoke-RestMethod `
    -Method Post `
    -Uri $uri `
    -Headers $headers `
    -Body ($payload | ConvertTo-Json -Depth 10)
}

try {
  Write-Host "TrensAI CRM Webhook Smoke Test" -ForegroundColor Green
  Write-Host "Backend: $BackendUrl"
  Write-Host "Device ID: $DeviceId"

  Write-Step "Send device.connected event"
  $resp1 = Invoke-Webhook @{
    event = "device.connected"
    device_id = $DeviceId
    phone_number = $Phone
    status = "connected"
  }
  Write-Host ("Response: " + ($resp1 | ConvertTo-Json -Depth 10))

  Write-Step "Send incoming message event"
  $resp2 = Invoke-Webhook @{
    device_id = $DeviceId
    phone_number = $Phone
    message_id = ("smoke_" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())
    content = "Smoke test message from scripts/smoke-webhook.ps1"
    type = "text"
    direction = "incoming"
    timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  }
  Write-Host ("Response: " + ($resp2 | ConvertTo-Json -Depth 10))

  Write-Host "`nSmoke test completed." -ForegroundColor Green
  Write-Host "Next: check Dashboard Inbox and Contacts data, or query DB tables messages/conversations/contacts."
}
catch {
  Write-Host "`nSmoke test failed:" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}
