<?php

namespace Modules\Contact\Repositories;

use App\Models\Contact;
use Illuminate\Pagination\AbstractPaginator;

class ContactRepository implements ContactRepositoryInterface
{
    public function paginate(int $tenantId, int $page, int $limit): AbstractPaginator
    {
        return Contact::where('tenant_id', $tenantId)
            ->latest()
            ->simplePaginate($limit, ['*'], 'page', $page);
    }

    public function find(int $id): ?Contact
    {
        return Contact::find($id);
    }

    public function create(array $data): Contact
    {
        return Contact::create($data);
    }

    public function update(int $id, array $data): Contact
    {
        $contact = Contact::findOrFail($id);
        $contact->update($data);
        return $contact->fresh();
    }

    public function delete(int $id): bool
    {
        return (bool) Contact::find($id)?->delete();
    }

    public function findByPhone(int $tenantId, string $phone): ?Contact
    {
        return Contact::where('tenant_id', $tenantId)
            ->where('phone_number', $phone)
            ->first();
    }
}
