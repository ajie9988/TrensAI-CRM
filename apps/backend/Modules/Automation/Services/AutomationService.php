<?php

namespace Modules\Automation\Services;

use App\Models\Flow;
use App\Models\Contact;
use Modules\Flow\Services\FlowService;

class AutomationService
{
    public function __construct(private FlowService $flowService) {}

    /**
     * Process incoming webhook trigger — match flows and execute them.
     */
    public function processWebhookTrigger(int $tenantId, int $deviceId, array $payload): array
    {
        $flows = Flow::where('tenant_id', $tenantId)
            ->where('device_id', $deviceId)
            ->where('is_active', true)
            ->where('trigger_type', 'webhook')
            ->get();

        $executed = [];
        foreach ($flows as $flow) {
            if (!empty($payload['contact_id'])) {
                $contact = Contact::find($payload['contact_id']);
                if ($contact) {
                    $log = $this->flowService->execute($flow, $contact, $payload);
                    $executed[] = ['flow_id' => $flow->id, 'log_id' => $log->id];
                }
            }
        }

        return $executed;
    }

    /**
     * Process keyword trigger — match flows by keyword.
     */
    public function processKeywordTrigger(int $tenantId, int $deviceId, string $message, Contact $contact): array
    {
        $flows = $this->flowService->matchTrigger($tenantId, $deviceId, 'keyword', $message);

        $executed = [];
        foreach ($flows as $flow) {
            $log = $this->flowService->execute($flow, $contact, ['message' => $message]);
            $executed[] = ['flow_id' => $flow->id, 'log_id' => $log->id];
        }

        return $executed;
    }

    /**
     * Process tag added trigger.
     */
    public function processTagTrigger(int $tenantId, int $deviceId, string $tag, Contact $contact): array
    {
        $flows = $this->flowService->matchTrigger($tenantId, $deviceId, 'tag', $tag);

        $executed = [];
        foreach ($flows as $flow) {
            $log = $this->flowService->execute($flow, $contact, ['tag' => $tag]);
            $executed[] = ['flow_id' => $flow->id, 'log_id' => $log->id];
        }

        return $executed;
    }

    public function getAvailableTriggers(): array
    {
        return [
            ['type' => 'message', 'label' => 'New Message Received', 'description' => 'Triggers on every incoming message'],
            ['type' => 'keyword', 'label' => 'Keyword Match', 'description' => 'Triggers when message matches a keyword'],
            ['type' => 'webhook', 'label' => 'Webhook', 'description' => 'Triggers from external HTTP webhook'],
            ['type' => 'schedule', 'label' => 'Schedule', 'description' => 'Triggers on a cron schedule'],
            ['type' => 'tag', 'label' => 'Tag Added', 'description' => 'Triggers when a tag is added to a contact'],
            ['type' => 'contact_field', 'label' => 'Contact Field Change', 'description' => 'Triggers when a contact field changes'],
        ];
    }

    public function getAvailableActions(): array
    {
        return [
            ['type' => 'send_message', 'label' => 'Send WhatsApp Message'],
            ['type' => 'send_ai_reply', 'label' => 'Send AI-Generated Reply'],
            ['type' => 'add_tag', 'label' => 'Add Tag to Contact'],
            ['type' => 'remove_tag', 'label' => 'Remove Tag from Contact'],
            ['type' => 'assign_conversation', 'label' => 'Assign Conversation'],
            ['type' => 'http_request', 'label' => 'HTTP Request (Webhook)'],
            ['type' => 'wait', 'label' => 'Wait / Delay'],
            ['type' => 'condition', 'label' => 'Condition / Branch'],
            ['type' => 'update_contact', 'label' => 'Update Contact Field'],
        ];
    }
}
