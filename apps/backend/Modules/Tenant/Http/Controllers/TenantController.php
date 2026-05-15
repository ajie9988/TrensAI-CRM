<?php

namespace Modules\Tenant\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Tenant\Services\TenantService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TenantController extends Controller
{
    public function __construct(private TenantService $tenantService) {}

    public function show(Request $request): JsonResponse
    {
        $tenantId = $request->attribute('tenant_id');
        $tenant = $this->tenantService->findById($tenantId);

        return response()->json(['data' => $tenant]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'domain' => 'nullable|string|max:255',
            'logo_url' => 'nullable|url',
        ]);

        $tenantId = $request->attribute('tenant_id');
        $tenant = $this->tenantService->update($tenantId, $validated);

        return response()->json(['data' => $tenant]);
    }

    public function stats(Request $request): JsonResponse
    {
        $tenantId = $request->attribute('tenant_id');
        return response()->json(['data' => $this->tenantService->getStats($tenantId)]);
    }
}
