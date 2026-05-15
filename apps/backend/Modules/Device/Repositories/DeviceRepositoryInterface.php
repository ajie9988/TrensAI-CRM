<?php

namespace Modules\Device\Repositories;

use App\Models\Device;
use Illuminate\Support\Collection;

interface DeviceRepositoryInterface
{
    public function allForTenant(int $tenantId): Collection;
    public function find(int $id): ?Device;
    public function create(array $data): Device;
    public function update(int $id, array $data): Device;
    public function delete(int $id): bool;
}
