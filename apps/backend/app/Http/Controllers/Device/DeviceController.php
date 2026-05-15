<?php

namespace App\Http\Controllers\Device;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class DeviceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->attributes->get('tenant_id');

        $devices = \App\Models\Device::where('tenant_id', $tenantId)
            ->with('user')
            ->get();

        $waBaseUrl = rtrim((string) config('services.wa_engine.url', ''), '/');
        $waApiKey = (string) config('services.wa_engine.key', '');

        if ($waBaseUrl !== '') {
            foreach ($devices as $device) {
                try {
                    $statusResponse = \Illuminate\Support\Facades\Http::withHeaders([
                        'X-API-Key' => $waApiKey,
                    ])->timeout(3)->get("{$waBaseUrl}/status/{$device->id}");

                    if (!$statusResponse->successful()) {
                        continue;
                    }

                    $connected = (bool) $statusResponse->json('connected');
                    $nextStatus = $connected ? 'connected' : ($device->status === 'connected' ? 'disconnected' : $device->status);

                    if ($device->status !== $nextStatus) {
                        $device->status = $nextStatus;
                    }

                    $device->last_activity_at = now();
                    if ($connected) {
                        $device->last_connected_at = now();
                    }

                    if ($device->isDirty()) {
                        $device->save();
                    }
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::debug('Device live status sync failed: ' . $e->getMessage());
                }
            }
        }

        return response()->json([
            'data' => $devices,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId = $request->attributes->get('tenant_id');
        $phoneNumber = $request->input('phone_number');

        $trashedDevice = \App\Models\Device::withTrashed()
            ->where('phone_number', $phoneNumber)
            ->where('tenant_id', $tenantId)
            ->first();

        $validated = $request->validate([
            'phone_number' => [
                'required',
                Rule::unique('devices')->whereNull('deleted_at'),
            ],
            'device_name' => 'nullable|string',
            'webhook_url' => 'nullable|url',
        ]);

        if ($trashedDevice?->trashed()) {
            $trashedDevice->restore();
            $trashedDevice->update(array_merge($validated, [
                'tenant_id' => $tenantId,
                'user_id' => $request->user()->id,
                'status' => 'disconnected',
            ]));

            return response()->json([
                'data' => $trashedDevice,
            ], 200);
        }

        $device = \App\Models\Device::create(array_merge($validated, [
            'tenant_id' => $tenantId,
            'user_id' => $request->user()->id,
            'status' => 'disconnected',
        ]));

        return response()->json([
            'data' => $device,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $device = \App\Models\Device::with('conversations')->find($id);

        if (!$device) {
            return response()->json(['message' => 'Device not found'], 404);
        }

        return response()->json([
            'data' => $device,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'device_name' => 'nullable|string',
            'webhook_url' => 'nullable|url',
            'is_ai_enabled' => 'nullable|boolean',
        ]);

        $device = \App\Models\Device::find($id);
        $device->update($validated);

        return response()->json([
            'data' => $device,
        ]);
    }

    public function toggleAI(Request $request, int $id): JsonResponse
    {
        $device = \App\Models\Device::find($id);
        
        if (!$device) {
            return response()->json(['message' => 'Device not found'], 404);
        }

        $device->update([
            'is_ai_enabled' => !$device->is_ai_enabled,
        ]);

        return response()->json([
            'message' => 'AI status updated',
            'data' => $device,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $device = \App\Models\Device::find($id);

        if (!$device) {
            return response()->json(['message' => 'Device not found'], 404);
        }

        $device->update([
            'status' => 'disconnected',
            'last_activity_at' => now(),
        ]);
        $device->delete();

        return response()->json(['message' => 'Device deleted']);
    }

    public function getQRCode(Request $request, int $id): JsonResponse
    {
        $device = \App\Models\Device::find($id);

        if (!$device) {
            return response()->json(['message' => 'Device not found'], 404);
        }

        try {
            $waBaseUrl = rtrim((string) config('services.wa_engine.url', ''), '/');
            $waApiKey = (string) config('services.wa_engine.key', '');

            \Illuminate\Support\Facades\Log::info('Fetching device QR', [
                'device_id' => $id,
                'wa_base_url' => $waBaseUrl,
                'device_status' => $device->status,
                'device_phone' => $device->phone_number,
            ]);

            if ($waBaseUrl === '') {
                return response()->json([
                    'message' => 'WA engine URL is not configured',
                ], 500);
            }

            // Keep connection lifecycle intact: do not stop an existing session when requesting QR.
            $statusResponse = \Illuminate\Support\Facades\Http::withHeaders([
                'X-API-Key' => $waApiKey,
            ])->timeout(5)->get("{$waBaseUrl}/status/{$device->id}");

            \Illuminate\Support\Facades\Log::info('WA engine status check', [
                'device_id' => $id,
                'status_code' => $statusResponse->status(),
                'connected' => $statusResponse->json('connected'),
                'body' => substr($statusResponse->body(), 0, 500),
            ]);

            if ($statusResponse->successful() && (bool) $statusResponse->json('connected') === true) {
                $device->update([
                    'status' => 'connected',
                    'last_connected_at' => now(),
                    'last_activity_at' => now(),
                ]);

                return response()->json([
                    'mode' => 'connected',
                    'message' => 'Device is already connected',
                    'qr_code' => null,
                    'pairing_code' => null,
                ], 200);
            }

            $device->update(['status' => 'connecting']);

            try {
                \Illuminate\Support\Facades\Http::withHeaders([
                    'X-API-Key' => $waApiKey,
                ])->timeout(5)->post("{$waBaseUrl}/sessions/{$device->id}/start", []);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Failed to start WA session for QR: ' . $e->getMessage());
            }


            $qrPayload = null;
            for ($attempt = 0; $attempt < 12; $attempt++) {
                $response = \Illuminate\Support\Facades\Http::withHeaders([
                    'X-API-Key' => $waApiKey,
                ])->timeout(5)->get("{$waBaseUrl}/qr/{$device->id}");

                \Illuminate\Support\Facades\Log::info('Polling WA engine for QR', [
                    'device_id' => $id,
                    'attempt' => $attempt + 1,
                    'status_code' => $response->status(),
                    'successful' => $response->successful(),
                ]);

                if ($response->successful()) {
                    $candidate = $response->json('qr');
                    if (is_string($candidate) && $candidate !== '') {
                        $qrPayload = $candidate;
                        break;
                    }
                }

                usleep(500000);
            }

            if (is_string($qrPayload) && $qrPayload !== '') {
                if (str_starts_with($qrPayload, 'data:image/') || str_starts_with($qrPayload, 'http://') || str_starts_with($qrPayload, 'https://')) {
                    $qrCodeUrl = $qrPayload;
                } else {
                    $qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=' . urlencode($qrPayload);
                }

                return response()->json([
                    'mode' => 'qr',
                    'qr_code' => $qrCodeUrl,
                    'pairing_code' => null,
                    'message' => 'QR ready',
                ]);
            }

            $pairingResponse = \Illuminate\Support\Facades\Http::withHeaders([
                'X-API-Key' => $waApiKey,
            ])->timeout(5)->get("{$waBaseUrl}/pairing-code/{$device->id}", [
                'phone_number' => $device->phone_number,
            ]);

            \Illuminate\Support\Facades\Log::info('WA pairing code fallback', [
                'device_id' => $id,
                'status_code' => $pairingResponse->status(),
                'pairing_code' => $pairingResponse->json('pairing_code'),
            ]);

            if ($pairingResponse->successful() && is_string($pairingResponse->json('pairing_code'))) {
                return response()->json([
                    'mode' => 'pairing_code',
                    'message' => 'QR not available yet, using pairing code fallback',
                    'pairing_code' => $pairingResponse->json('pairing_code'),
                    'qr_code' => null,
                ], 200);
            }

            return response()->json([
                'mode' => 'unavailable',
                'message' => 'QR not available yet, keep this modal open while device is connecting',
                'qr_code' => null,
                'pairing_code' => null,
            ], 404);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to fetch device QR: ' . $e->getMessage(), [
                'device_id' => $id,
                'exception' => $e,
            ]);

            return response()->json([
                'mode' => 'error',
                'message' => 'Failed to fetch QR code',
                'qr_code' => null,
                'pairing_code' => null,
            ], 500);
        }
    }

    public function disconnect(int $id): JsonResponse
    {
        $device = \App\Models\Device::find($id);

        if (!$device) {
            return response()->json(['message' => 'Device not found'], 404);
        }

        try {
            \Illuminate\Support\Facades\Http::withHeaders([
                'X-API-Key' => config('services.wa_engine.key'),
            ])->timeout(5)->post(rtrim((string) config('services.wa_engine.url'), '/') . "/sessions/{$device->id}/stop", []);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('wa-engine stop failed: ' . $e->getMessage());
        }

        $device->update([
            'status' => 'disconnected',
            'last_activity_at' => now(),
        ]);

        return response()->json([
            'message' => 'Device disconnected',
            'data' => $device,
        ]);
    }

    public function reconnect(Request $request, int $id): JsonResponse
    {
        $device = \App\Models\Device::find($id);

        if (!$device) {
            return response()->json(['message' => 'Device not found'], 404);
        }

        // Mark as connecting while QR is being generated
        $device->update(['status' => 'connecting']);

        // TODO: Trigger wa-engine to start reconnect
        try {
            \Illuminate\Support\Facades\Http::withHeaders([
                'X-API-Key' => config('services.wa_engine.key'),
            ])->timeout(5)->post(rtrim((string) config('services.wa_engine.url'), '/') . '/reconnect', [
                'device_id' => $device->id,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('wa-engine reconnect failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Reconnect initiated',
            'data' => $device,
        ]);
    }
}
