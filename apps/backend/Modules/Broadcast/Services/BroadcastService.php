<?php

namespace Modules\Broadcast\Services;

use App\Models\Broadcast;
use App\Models\Contact;
use Illuminate\Support\Facades\Bus;

class BroadcastService
{
    public function createBroadcast(int $tenantId, int $userId, array $data): Broadcast
    {
        return Broadcast::create(array_merge($data, [
            'tenant_id' => $tenantId,
            'created_by_user_id' => $userId,
            'status' => 'draft',
        ]));
    }

    public function updateBroadcast(int $id, array $data): Broadcast
    {
        $broadcast = Broadcast::findOrFail($id);
        $broadcast->update($data);
        return $broadcast->fresh();
    }

    public function deleteBroadcast(int $id): void
    {
        Broadcast::find($id)?->delete();
    }

    public function send(Broadcast $broadcast): void
    {
        // Resolve recipients
        $contacts = $this->resolveRecipients($broadcast);

        $broadcast->update([
            'status' => 'sending',
            'started_at' => now(),
            'total_contacts' => $contacts->count(),
            'sent_count' => 0,
            'failed_count' => 0,
        ]);

        // Dispatch individual send jobs with configurable delay
        $delayMs = $broadcast->delay_ms ?? 1000;
        $contacts->each(function (Contact $contact, int $index) use ($broadcast, $delayMs) {
            \App\Jobs\ProcessMessageJob::dispatch([
                'type' => 'broadcast',
                'broadcast_id' => $broadcast->id,
                'contact_id' => $contact->id,
                'device_id' => $broadcast->device_id,
                'message' => $broadcast->message,
            ])->delay(now()->addMilliseconds($delayMs * $index));
        });
    }

    public function getProgress(Broadcast $broadcast): array
    {
        return [
            'status' => $broadcast->status,
            'total' => $broadcast->total_contacts ?? 0,
            'sent' => $broadcast->sent_count ?? 0,
            'failed' => $broadcast->failed_count ?? 0,
            'progress' => ($broadcast->total_contacts ?? 0) > 0
                ? round((($broadcast->sent_count ?? 0) / $broadcast->total_contacts) * 100)
                : 0,
        ];
    }

    public function markComplete(int $broadcastId): void
    {
        Broadcast::where('id', $broadcastId)->update([
            'status' => 'sent',
            'completed_at' => now(),
        ]);
    }

    private function resolveRecipients(Broadcast $broadcast)
    {
        $query = Contact::where('tenant_id', $broadcast->tenant_id);

        if (!empty($broadcast->target_contacts)) {
            $query->whereIn('id', $broadcast->target_contacts);
        } elseif (!empty($broadcast->target_tags)) {
            foreach ($broadcast->target_tags as $tag) {
                $query->whereJsonContains('tags', $tag);
            }
        }

        return $query->get();
    }
}
