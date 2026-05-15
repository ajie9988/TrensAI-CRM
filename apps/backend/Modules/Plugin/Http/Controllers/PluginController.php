<?php

namespace Modules\Plugin\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Plugin\Services\PluginService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PluginController extends Controller
{
    public function __construct(private PluginService $pluginService) {}

    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->attribute('tenant_id');
        return response()->json(['data' => $this->pluginService->listPlugins($tenantId)]);
    }

    public function enable(Request $request, string $key): JsonResponse
    {
        $tenantId = $request->attribute('tenant_id');
        $this->pluginService->enablePlugin($tenantId, $key);
        return response()->json(['message' => "Plugin '{$key}' enabled"]);
    }

    public function disable(Request $request, string $key): JsonResponse
    {
        $tenantId = $request->attribute('tenant_id');
        $this->pluginService->disablePlugin($tenantId, $key);
        return response()->json(['message' => "Plugin '{$key}' disabled"]);
    }

    public function getConfig(Request $request, string $key): JsonResponse
    {
        $tenantId = $request->attribute('tenant_id');
        $config = $this->pluginService->getPluginConfig($tenantId, $key);
        // Mask secret values before returning
        $masked = array_map(fn($v) => str_contains(strtolower('api_key secret'), strtolower($key)) ? '***' : $v, $config);
        return response()->json(['data' => $masked]);
    }

    public function updateConfig(Request $request, string $key): JsonResponse
    {
        $tenantId = $request->attribute('tenant_id');
        $config = $this->pluginService->updatePluginConfig($tenantId, $key, $request->all());
        return response()->json(['data' => $config]);
    }
}
