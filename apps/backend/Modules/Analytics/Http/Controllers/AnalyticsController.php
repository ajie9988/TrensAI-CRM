<?php

namespace Modules\Analytics\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Analytics\Services\AnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AnalyticsController extends Controller
{
    public function __construct(private AnalyticsService $analyticsService) {}

    public function overview(Request $request): JsonResponse
    {
        $tenantId = $request->attribute('tenant_id');
        return response()->json(['data' => $this->analyticsService->getOverview($tenantId)]);
    }

    public function messages(Request $request): JsonResponse
    {
        $tenantId = $request->attribute('tenant_id');
        $period = $request->query('period', '7days');

        return response()->json(['data' => $this->analyticsService->getMessageStats($tenantId, $period)]);
    }

    public function topContacts(Request $request): JsonResponse
    {
        $tenantId = $request->attribute('tenant_id');
        $limit = (int) $request->query('limit', 10);

        return response()->json(['data' => $this->analyticsService->getTopContacts($tenantId, $limit)]);
    }

    public function broadcasts(Request $request): JsonResponse
    {
        $tenantId = $request->attribute('tenant_id');
        return response()->json(['data' => $this->analyticsService->getBroadcastStats($tenantId)]);
    }
}
