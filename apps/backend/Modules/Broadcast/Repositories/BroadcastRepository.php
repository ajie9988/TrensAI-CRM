<?php

namespace Modules\Broadcast\Repositories;

use App\Models\Broadcast;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class BroadcastRepository implements BroadcastRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage = 50): LengthAwarePaginator
    {
        return Broadcast::where('tenant_id', $tenantId)
            ->with(['device', 'createdByUser'])
            ->latest()
            ->paginate($perPage);
    }

    public function find(int $id): ?Broadcast
    {
        return Broadcast::find($id);
    }

    public function create(array $data): Broadcast
    {
        return Broadcast::create($data);
    }

    public function update(int $id, array $data): Broadcast
    {
        $broadcast = Broadcast::findOrFail($id);
        $broadcast->update($data);
        return $broadcast->fresh();
    }

    public function delete(int $id): bool
    {
        return (bool) Broadcast::find($id)?->delete();
    }
}
