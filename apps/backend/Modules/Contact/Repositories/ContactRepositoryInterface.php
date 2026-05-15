<?php

namespace Modules\Contact\Repositories;

use App\Models\Contact;
use Illuminate\Pagination\AbstractPaginator;

interface ContactRepositoryInterface
{
    public function paginate(int $tenantId, int $page, int $limit): AbstractPaginator;
    public function find(int $id): ?Contact;
    public function create(array $data): Contact;
    public function update(int $id, array $data): Contact;
    public function delete(int $id): bool;
    public function findByPhone(int $tenantId, string $phone): ?Contact;
}
