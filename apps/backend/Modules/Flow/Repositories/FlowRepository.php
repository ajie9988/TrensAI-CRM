<?php

namespace Modules\Flow\Repositories;

use App\Models\Flow;
use App\Models\FlowLog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class FlowRepository implements FlowRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage = 50): LengthAwarePaginator
    {
        return Flow::where('tenant_id', $tenantId)
            ->with(['device', 'createdByUser'])
            ->latest()
            ->paginate($perPage);
    }

    public function find(int $id): ?Flow
    {
        return Flow::with('flowLogs')->find($id);
    }

    public function create(array $data): Flow
    {
        return Flow::create($data);
    }

    public function update(int $id, array $data): Flow
    {
        $flow = Flow::findOrFail($id);
        $flow->update($data);
        return $flow->fresh();
    }

    public function delete(int $id): bool
    {
        return (bool) Flow::find($id)?->delete();
    }

    public function getLogs(int $flowId, int $perPage = 50): LengthAwarePaginator
    {
        return FlowLog::where('flow_id', $flowId)
            ->with('contact')
            ->latest()
            ->paginate($perPage);
    }
}
