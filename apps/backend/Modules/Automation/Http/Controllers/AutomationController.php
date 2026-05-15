<?php

namespace Modules\Automation\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Automation\Services\AutomationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AutomationController extends Controller
{
    public function __construct(private AutomationService $automationService) {}

    public function triggers(): JsonResponse
    {
        return response()->json([
            'data' => $this->automationService->getAvailableTriggers(),
        ]);
    }

    public function actions(): JsonResponse
    {
        return response()->json([
            'data' => $this->automationService->getAvailableActions(),
        ]);
    }

    public function processWebhook(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'device_id' => 'required|integer|exists:devices,id',
            'contact_id' => 'nullable|integer|exists:contacts,id',
            'payload' => 'nullable|array',
        ]);

        $tenantId = $request->attribute('tenant_id');
        $executed = $this->automationService->processWebhookTrigger(
            $tenantId,
            $validated['device_id'],
            array_merge(['contact_id' => $validated['contact_id'] ?? null], $validated['payload'] ?? [])
        );

        return response()->json([
            'message' => 'Webhook processed',
            'executions' => $executed,
        ]);
    }
}
