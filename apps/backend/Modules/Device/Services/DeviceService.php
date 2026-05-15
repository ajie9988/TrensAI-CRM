<?php

namespace Modules\Device\Services;

use App\Models\Device;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;

class DeviceService
{
    public function getDevices(int $tenantId): Collection
    {
        return Device::where('tenant_id', $tenantId)->with('user')->get();
    }

    public function createDevice(int $tenantId, int $userId, array $data): Device
    {
        return Device::create(array_merge($data, [
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'status' => 'disconnected',
        ]));
    }

    public function updateDevice(int $id, array $data): Device
    {
        $device = Device::findOrFail($id);
        $device->update($data);
        return $device->fresh();
    }

    public function deleteDevice(int $id): void
    {
        Device::find($id)?->delete();
    }

    public function requestQRCode(Device $device): array
    {
        // Call wa-engine service to generate QR
        $waEngineUrl = config('services.wa_engine.url', env('WA_ENGINE_URL', 'http://wa-engine:3001'));

        try {
            $response = Http::timeout(10)->post("{$waEngineUrl}/devices/{$device->id}/qr");
            return $response->json() ?? ['qr' => null, 'status' => 'pending'];
        } catch (\Exception $e) {
            return ['qr' => null, 'status' => 'error', 'message' => $e->getMessage()];
        }
    }

    public function disconnect(Device $device): void
    {
        $waEngineUrl = config('services.wa_engine.url', env('WA_ENGINE_URL', 'http://wa-engine:3001'));

        try {
            Http::timeout(10)->post("{$waEngineUrl}/devices/{$device->id}/disconnect");
        } catch (\Exception) {
            // Best-effort
        }

        $device->update(['status' => 'disconnected', 'session_data' => null]);
    }

    public function markConnected(int $deviceId, string $sessionId): void
    {
        Device::where('id', $deviceId)->update([
            'status' => 'connected',
            'session_id' => $sessionId,
            'last_connected_at' => now(),
        ]);
    }

    public function markDisconnected(int $deviceId): void
    {
        Device::where('id', $deviceId)->update([
            'status' => 'disconnected',
            'session_data' => null,
        ]);
    }
}
