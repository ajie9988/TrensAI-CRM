<?php

namespace Modules\User\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function getUsers(int $tenantId, int $perPage = 50): LengthAwarePaginator
    {
        return User::where('tenant_id', $tenantId)
            ->latest()
            ->paginate($perPage);
    }

    public function findById(int $id): ?User
    {
        return User::find($id);
    }

    public function createUser(int $tenantId, array $data): User
    {
        return User::create([
            'tenant_id' => $tenantId,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'] ?? 'agent',
            'status' => 'active',
        ]);
    }

    public function updateUser(int $id, array $data): User
    {
        $user = User::findOrFail($id);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);
        return $user->fresh();
    }

    public function deleteUser(int $id): void
    {
        User::find($id)?->delete();
    }

    public function changeRole(int $id, string $role): User
    {
        $user = User::findOrFail($id);
        $user->update(['role' => $role]);
        return $user->fresh();
    }

    public function toggleStatus(int $id): User
    {
        $user = User::findOrFail($id);
        $user->update([
            'status' => $user->status === 'active' ? 'inactive' : 'active',
        ]);
        return $user->fresh();
    }

    public function getAvailableRoles(): array
    {
        return ['admin', 'manager', 'agent', 'viewer'];
    }
}
