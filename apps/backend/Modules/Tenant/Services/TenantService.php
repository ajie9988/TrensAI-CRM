<?php

namespace Modules\Tenant\Services;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Str;

class TenantService
{
    public function findById(int $id): ?Tenant
    {
        return Tenant::find($id);
    }

    public function create(array $data): Tenant
    {
        return Tenant::create(array_merge($data, [
            'slug' => $data['slug'] ?? Str::slug($data['name']),
            'status' => 'active',
        ]));
    }

    public function update(int $id, array $data): Tenant
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->update($data);
        return $tenant->fresh();
    }

    public function getStats(int $tenantId): array
    {
        $tenant = Tenant::withCount([
            'users',
            'devices',
            'contacts',
            'conversations',
            'messages',
        ])->findOrFail($tenantId);

        return [
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'status' => $tenant->status,
            'plan' => $tenant->plan ?? 'free',
            'users_count' => $tenant->users_count,
            'devices_count' => $tenant->devices_count,
            'contacts_count' => $tenant->contacts_count,
            'conversations_count' => $tenant->conversations_count,
            'messages_count' => $tenant->messages_count,
            'created_at' => $tenant->created_at,
        ];
    }

    public function suspend(int $id): Tenant
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->update(['status' => 'suspended']);
        return $tenant;
    }

    public function activate(int $id): Tenant
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->update(['status' => 'active']);
        return $tenant;
    }
}
