<?php

namespace Modules\Broadcast\Repositories;

use App\Models\Broadcast;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface BroadcastRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage): LengthAwarePaginator;
    public function find(int $id): ?Broadcast;
    public function create(array $data): Broadcast;
    public function update(int $id, array $data): Broadcast;
    public function delete(int $id): bool;
}
