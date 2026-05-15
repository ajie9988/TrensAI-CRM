<?php

namespace App\Http\Controllers\Broadcast;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BroadcastController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->attributes->get('tenant_id');
        
        $broadcasts = \App\Models\Broadcast::where('tenant_id', $tenantId)
            ->with(['device', 'createdByUser'])
            ->latest()
            ->paginate(50);

        return response()->json($broadcasts);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'device_id' => 'required|exists:devices,id',
            'name' => 'required|string',
            'message' => 'required|string',
            'target_contacts' => 'nullable|array',
            'target_tags' => 'nullable|array',
            'scheduled_at' => 'nullable|date',
            'delay_ms' => 'nullable|integer',
        ]);

        $tenantId = $request->attributes->get('tenant_id');
        $broadcast = \App\Models\Broadcast::create(array_merge($validated, [
            'tenant_id' => $tenantId,
            'created_by_user_id' => $request->user()->id,
            'status' => 'draft',
        ]));

        return response()->json([
            'data' => $broadcast,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $broadcast = \App\Models\Broadcast::find($id);

        if (!$broadcast) {
            return response()->json(['message' => 'Broadcast not found'], 404);
        }

        return response()->json([
            'data' => $broadcast,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'nullable|string',
            'message' => 'nullable|string',
            'scheduled_at' => 'nullable|date',
        ]);

        $broadcast = \App\Models\Broadcast::find($id);
        $broadcast->update($validated);

        return response()->json([
            'data' => $broadcast,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        \App\Models\Broadcast::find($id)?->delete();

        return response()->json(['message' => 'Broadcast deleted']);
    }

    public function send(int $id): JsonResponse
    {
        // TODO: Queue broadcast sending

        $broadcast = \App\Models\Broadcast::find($id);
        $broadcast->update(['status' => 'sending', 'started_at' => now()]);

        return response()->json([
            'message' => 'Broadcast sending started',
        ]);
    }

    public function getStatus(int $id): JsonResponse
    {
        $broadcast = \App\Models\Broadcast::find($id);

        return response()->json([
            'data' => [
                'status' => $broadcast->status,
                'total' => $broadcast->total_contacts,
                'sent' => $broadcast->sent_count,
                'failed' => $broadcast->failed_count,
                'progress' => $broadcast->total_contacts > 0 
                    ? round(($broadcast->sent_count / $broadcast->total_contacts) * 100)
                    : 0,
            ],
        ]);
    }
}
