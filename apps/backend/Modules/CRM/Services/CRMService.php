<?php

namespace Modules\CRM\Services;

use App\Models\Contact;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CRMService
{
    /**
     * Get pipeline stages with contact counts.
     */
    public function getPipeline(int $tenantId): array
    {
        $stages = ['lead', 'prospect', 'qualified', 'proposal', 'won', 'lost'];

        return array_map(function (string $stage) use ($tenantId) {
            $contacts = Contact::where('tenant_id', $tenantId)
                ->whereJsonContains('tags', $stage)
                ->get(['id', 'name', 'phone_number', 'email', 'created_at']);

            return [
                'stage' => $stage,
                'label' => ucfirst($stage),
                'count' => $contacts->count(),
                'contacts' => $contacts,
            ];
        }, $stages);
    }

    /**
     * Move contact to a new pipeline stage (replaces old stage tag).
     */
    public function moveStage(int $contactId, string $newStage): Contact
    {
        $stages = ['lead', 'prospect', 'qualified', 'proposal', 'won', 'lost'];
        $contact = Contact::findOrFail($contactId);

        $tags = array_diff($contact->tags ?? [], $stages);
        $tags[] = $newStage;

        $contact->update(['tags' => array_values($tags)]);

        return $contact->fresh();
    }

    /**
     * Get activity timeline for a contact.
     */
    public function getContactTimeline(int $contactId): array
    {
        $contact = Contact::with([
            'conversations.messages' => fn($q) => $q->latest()->limit(5),
        ])->findOrFail($contactId);

        $timeline = [];

        foreach ($contact->conversations as $conv) {
            foreach ($conv->messages as $msg) {
                $timeline[] = [
                    'type' => 'message',
                    'direction' => $msg->direction,
                    'content' => $msg->content,
                    'timestamp' => $msg->created_at,
                ];
            }
        }

        usort($timeline, fn($a, $b) => $b['timestamp'] <=> $a['timestamp']);

        return $timeline;
    }

    /**
     * Get CRM summary stats.
     */
    public function getSummary(int $tenantId): array
    {
        $stages = ['lead', 'prospect', 'qualified', 'proposal', 'won', 'lost'];
        $counts = [];

        foreach ($stages as $stage) {
            $counts[$stage] = Contact::where('tenant_id', $tenantId)
                ->whereJsonContains('tags', $stage)
                ->count();
        }

        return $counts;
    }
}
