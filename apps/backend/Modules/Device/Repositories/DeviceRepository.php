<?php

namespace Modules\Device\Repositories;

use App\Models\Device;
use Illuminate\Support\Collection;

class DeviceRepository implements DeviceRepositoryInterface
{
    public function allForTenant(int $tenantId): Collection
    {
        return Device::where('tenant_id', $tenantId)->with('user')->get();
    }

    public function find(int $id): ?Device
    {
        return Device::with('conversations')->find($id);
    }

    public function create(array $data): Device
    {
        return Device::create($data);
    }

    public function update(int $id, array $data): Device
    {
        $device = Device::findOrFail($id);
        $device->update($data);
        return $device->fresh();
    }

    public function delete(int $id): bool
    {
        return (bool) Device::find($id)?->delete();
    }
}
