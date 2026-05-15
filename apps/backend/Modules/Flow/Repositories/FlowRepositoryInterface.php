<?php

namespace Modules\Flow\Repositories;

use App\Models\Flow;
use App\Models\FlowLog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface FlowRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage): LengthAwarePaginator;
    public function find(int $id): ?Flow;
    public function create(array $data): Flow;
    public function update(int $id, array $data): Flow;
    public function delete(int $id): bool;
    public function getLogs(int $flowId, int $perPage): LengthAwarePaginator;
}
