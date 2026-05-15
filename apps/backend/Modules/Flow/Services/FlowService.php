<?php

namespace Modules\Flow\Services;

use App\Models\Flow;
use App\Models\FlowLog;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Device;
use App\Models\Message;

class FlowService
{
    public function createFlow(int $tenantId, int $userId, array $data): Flow
    {
        return Flow::create(array_merge($data, [
            'tenant_id' => $tenantId,
            'created_by_user_id' => $userId,
            'is_active' => false,
        ]));
    }

    public function updateFlow(int $id, array $data): Flow
    {
        $flow = Flow::findOrFail($id);
        $flow->update($data);
        return $flow->fresh();
    }

    public function deleteFlow(int $id): void
    {
        Flow::find($id)?->delete();
    }

    public function activate(int $id): Flow
    {
        $flow = Flow::findOrFail($id);
        $flow->update(['is_active' => true]);
        return $flow;
    }

    public function deactivate(int $id): Flow
    {
        $flow = Flow::findOrFail($id);
        $flow->update(['is_active' => false]);
        return $flow;
    }

    /**
     * Execute a flow for a specific contact.
     * Returns the created FlowLog.
     */
    public function execute(Flow $flow, Contact $contact, array $context = []): FlowLog
    {
        $log = FlowLog::create([
            'flow_id' => $flow->id,
            'tenant_id' => $flow->tenant_id,
            'contact_id' => $contact->id,
            'device_id' => $flow->device_id,
            'status' => 'running',
            'context' => $context,
            'started_at' => now(),
        ]);

        return $log;
    }

    public function markExecutionComplete(int $logId, bool $success, ?string $error = null): void
    {
        FlowLog::where('id', $logId)->update([
            'status' => $success ? 'completed' : 'failed',
            'error_message' => $error,
            'completed_at' => now(),
        ]);
    }

    /**
     * Find all active flows that match an incoming trigger.
     */
    public function matchTrigger(int $tenantId, int $deviceId, string $triggerType, string $value): \Illuminate\Support\Collection
    {
        return Flow::where('tenant_id', $tenantId)
            ->where('device_id', $deviceId)
            ->where('is_active', true)
            ->where('trigger_type', $triggerType)
            ->where(function ($q) use ($value) {
                $q->where('trigger_value', $value)
                  ->orWhereNull('trigger_value');
            })
            ->get();
    }

    /**
     * Evaluate and execute active flows for an incoming message.
     */
    public static function dispatchForMessage(
        Message $message,
        Conversation $conversation,
        Contact $contact,
        Device $device
    ): void {
        $service = app(self::class);
        $keyword = trim((string) $message->content);

        $flows = $service->matchTrigger(
            $device->tenant_id,
            $device->id,
            'keyword',
            $keyword
        );

        foreach ($flows as $flow) {
            $log = $service->execute($flow, $contact, [
                'message_id' => $message->id,
                'conversation_id' => $conversation->id,
                'device_id' => $device->id,
            ]);

            // Placeholder execution result until flow runner engine is implemented.
            $service->markExecutionComplete($log->id, true);
        }
    }
}
