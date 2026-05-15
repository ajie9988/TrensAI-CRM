<?php

namespace App\Http\Controllers\Flow;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FlowController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->attributes->get('tenant_id');
        
        $flows = \App\Models\Flow::where('tenant_id', $tenantId)
            ->with(['device', 'createdByUser'])
            ->latest()
            ->paginate(50);

        return response()->json($flows);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'device_id' => 'required|exists:devices,id',
            'name' => 'required|string',
            'description' => 'nullable|string',
            'nodes' => 'required|json',
            'edges' => 'required|json',
            'trigger_type' => 'required|in:message,keyword,webhook,schedule,tag,contact_field',
            'trigger_value' => 'nullable|string',
        ]);

        $tenantId = $request->attributes->get('tenant_id');
        $flow = \App\Models\Flow::create(array_merge($validated, [
            'tenant_id' => $tenantId,
            'created_by_user_id' => $request->user()->id,
        ]));

        return response()->json([
            'data' => $flow,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $flow = \App\Models\Flow::with('flowLogs')->find($id);

        if (!$flow) {
            return response()->json(['message' => 'Flow not found'], 404);
        }

        return response()->json([
            'data' => $flow,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'nullable|string',
            'description' => 'nullable|string',
            'nodes' => 'nullable|json',
            'edges' => 'nullable|json',
            'is_active' => 'nullable|boolean',
        ]);

        $flow = \App\Models\Flow::find($id);
        $flow->update($validated);

        return response()->json([
            'data' => $flow,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        \App\Models\Flow::find($id)?->delete();

        return response()->json(['message' => 'Flow deleted']);
    }

    public function execute(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'contact_id' => 'required|exists:contacts,id',
            'context' => 'nullable|array',
        ]);

        // TODO: Execute flow
        // TODO: Log execution

        return response()->json([
            'message' => 'Flow execution started',
        ]);
    }

    public function getLogs(Request $request, int $id): JsonResponse
    {
        $logs = \App\Models\FlowLog::where('flow_id', $id)
            ->with(['contact'])
            ->latest()
            ->paginate(50);

        return response()->json($logs);
    }

    public function activate(int $id): JsonResponse
    {
        $flow = \App\Models\Flow::find($id);

        if (!$flow) {
            return response()->json(['message' => 'Flow not found'], 404);
        }

        $flow->update(['is_active' => true]);

        return response()->json(['message' => 'Flow activated', 'data' => $flow]);
    }

    public function deactivate(int $id): JsonResponse
    {
        $flow = \App\Models\Flow::find($id);

        if (!$flow) {
            return response()->json(['message' => 'Flow not found'], 404);
        }

        $flow->update(['is_active' => false]);

        return response()->json(['message' => 'Flow deactivated', 'data' => $flow]);
    }
}
