<?php

namespace Modules\User\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\User\Services\UserService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    public function __construct(private UserService $userService) {}

    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->attribute('tenant_id');
        $users = $this->userService->getUsers($tenantId);

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'nullable|in:admin,manager,agent,viewer',
        ]);

        $tenantId = $request->attribute('tenant_id');
        $user = $this->userService->createUser($tenantId, $validated);

        return response()->json(['data' => $user], 201);
    }

    public function show(int $id): JsonResponse
    {
        $user = $this->userService->findById($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json(['data' => $user]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8',
        ]);

        $user = $this->userService->updateUser($id, $validated);

        return response()->json(['data' => $user]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->userService->deleteUser($id);
        return response()->json(['message' => 'User deleted']);
    }

    public function changeRole(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'role' => 'required|in:admin,manager,agent,viewer',
        ]);

        $user = $this->userService->changeRole($id, $validated['role']);

        return response()->json(['data' => $user]);
    }

    public function toggleStatus(int $id): JsonResponse
    {
        $user = $this->userService->toggleStatus($id);
        return response()->json(['data' => $user]);
    }

    public function roles(): JsonResponse
    {
        return response()->json(['data' => $this->userService->getAvailableRoles()]);
    }
}
