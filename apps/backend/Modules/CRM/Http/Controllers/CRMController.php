<?php

namespace Modules\CRM\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\CRM\Services\CRMService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CRMController extends Controller
{
    public function __construct(private CRMService $crmService) {}

    public function pipeline(Request $request): JsonResponse
    {
        $tenantId = $request->attribute('tenant_id');
        return response()->json(['data' => $this->crmService->getPipeline($tenantId)]);
    }

    public function summary(Request $request): JsonResponse
    {
        $tenantId = $request->attribute('tenant_id');
        return response()->json(['data' => $this->crmService->getSummary($tenantId)]);
    }

    public function moveStage(Request $request, int $contactId): JsonResponse
    {
        $validated = $request->validate([
            'stage' => 'required|in:lead,prospect,qualified,proposal,won,lost',
        ]);

        $contact = $this->crmService->moveStage($contactId, $validated['stage']);

        return response()->json(['data' => $contact]);
    }

    public function timeline(Request $request, int $contactId): JsonResponse
    {
        $timeline = $this->crmService->getContactTimeline($contactId);
        return response()->json(['data' => $timeline]);
    }
}
