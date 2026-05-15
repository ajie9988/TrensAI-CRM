<?php

namespace Modules\Analytics\Services;

use App\Models\Message;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Broadcast;
use App\Models\Flow;
use App\Models\FlowLog;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    public function getOverview(int $tenantId): array
    {
        return [
            // Flat keys for dashboard frontend
            'total_messages' => Message::where('tenant_id', $tenantId)->count(),
            'total_contacts' => Contact::where('tenant_id', $tenantId)->count(),
            'open_conversations' => Conversation::where('tenant_id', $tenantId)->where('status', 'open')->count(),
            'active_devices' => \App\Models\Device::where('tenant_id', $tenantId)->where('status', 'connected')->count(),

            // Detailed breakdown
            'messages' => [
                'total' => Message::where('tenant_id', $tenantId)->count(),
                'today' => Message::where('tenant_id', $tenantId)->whereDate('created_at', today())->count(),
                'incoming' => Message::where('tenant_id', $tenantId)->where('direction', 'incoming')->count(),
                'outgoing' => Message::where('tenant_id', $tenantId)->where('direction', 'outgoing')->count(),
            ],
            'contacts' => [
                'total' => Contact::where('tenant_id', $tenantId)->count(),
                'new_this_week' => Contact::where('tenant_id', $tenantId)->where('created_at', '>=', now()->startOfWeek())->count(),
            ],
            'conversations' => [
                'total' => Conversation::where('tenant_id', $tenantId)->count(),
                'open' => Conversation::where('tenant_id', $tenantId)->where('status', 'open')->count(),
                'resolved' => Conversation::where('tenant_id', $tenantId)->where('status', 'resolved')->count(),
            ],
            'broadcasts' => [
                'total' => \App\Models\Broadcast::where('tenant_id', $tenantId)->count(),
                'sent' => \App\Models\Broadcast::where('tenant_id', $tenantId)->where('status', 'completed')->count(),
            ],
            'flows' => [
                'active' => Flow::where('tenant_id', $tenantId)->where('is_active', true)->count(),
                'executions_today' => FlowLog::where('tenant_id', $tenantId)->whereDate('created_at', today())->count(),
                'failed_today' => FlowLog::where('tenant_id', $tenantId)->whereDate('created_at', today())->where('status', 'failed')->count(),
            ],
        ];
    }

    public function getMessageStats(int $tenantId, string $period = '7days'): array
    {
        $days = match ($period) {
            '30days' => 30,
            '90days' => 90,
            default => 7,
        };

        $stats = Message::where('tenant_id', $tenantId)
            ->where('created_at', '>=', now()->subDays($days))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'), 'direction')
            ->groupBy('date', 'direction')
            ->orderBy('date')
            ->get();

        return $stats->groupBy('date')->map(function ($dayStats) {
            return [
                'incoming' => $dayStats->where('direction', 'incoming')->first()?->count ?? 0,
                'outgoing' => $dayStats->where('direction', 'outgoing')->first()?->count ?? 0,
            ];
        })->toArray();
    }

    public function getTopContacts(int $tenantId, int $limit = 10): array
    {
        return Contact::where('contacts.tenant_id', $tenantId)
            ->join('messages', 'contacts.id', '=', 'messages.contact_id')
            ->select('contacts.id', 'contacts.name', 'contacts.phone_number', DB::raw('count(messages.id) as message_count'))
            ->groupBy('contacts.id', 'contacts.name', 'contacts.phone_number')
            ->orderByDesc('message_count')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    public function getBroadcastStats(int $tenantId): array
    {
        return Broadcast::where('tenant_id', $tenantId)
            ->select('status', DB::raw('count(*) as count'), DB::raw('sum(sent_count) as total_sent'), DB::raw('sum(failed_count) as total_failed'))
            ->groupBy('status')
            ->get()
            ->toArray();
    }
}
