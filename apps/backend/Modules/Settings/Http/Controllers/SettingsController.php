<?php

namespace Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Settings\Services\SettingsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SettingsController extends Controller
{
    public function __construct(private SettingsService $settingsService) {}

    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->attribute('tenant_id');
        $defaults = $this->settingsService->getDefaultSettings();
        $current = $this->settingsService->getSettings($tenantId);

        return response()->json(['data' => array_merge($defaults, $current)]);
    }

    public function update(Request $request): JsonResponse
    {
        $tenantId = $request->attribute('tenant_id');
        $updated = $this->settingsService->updateSettings($tenantId, $request->all());

        return response()->json([
            'message' => 'Settings updated',
            'data' => $updated,
        ]);
    }

    public function getSetting(Request $request, string $key): JsonResponse
    {
        $tenantId = $request->attribute('tenant_id');
        $value = $this->settingsService->getSetting($tenantId, $key);

        return response()->json(['data' => [$key => $value]]);
    }
}
