<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Support\Collection;

class ChatService
{
    public function getConversations(int $tenantId, ?int $deviceId = null, int $limit = 50): Collection
    {
        $query = Conversation::query()
            ->where('tenant_id', $tenantId)
            ->with(['contact', 'assignedUser', 'messages' => fn($q) => $q->latest()->limit(1)])
            ->latest('last_message_at');

        if ($deviceId !== null) {
            $query->where('device_id', $deviceId);
        }

        return $query->take($limit)->get();
    }

    public function getMessages(int $conversationId, int $limit = 50, ?int $offset = null): Collection
    {
        $query = Message::query()
            ->where('conversation_id', $conversationId)
            ->latest('created_at')
            ->take($limit);

        if ($offset) {
            $query->skip($offset);
        }

        // Fetch latest messages then reverse to show oldest first (asc) for the chat box
        return $query->get()->reverse()->values();
    }

    public function createMessage(array $data): Message
    {
        $message = Message::create($data);

        // Update conversation
        Conversation::find($data['conversation_id'])->update([
            'last_message_at' => now(),
            'unread_count' => $data['direction'] === 'incoming' ? 1 : 0,
        ]);

        return $message;
    }

    public function markAsRead(int $messageId): Message
    {
        $message = Message::find($messageId);
        $message->update([
            'is_read' => true,
            'read_at' => now(),
            'status' => 'read',
        ]);

        return $message;
    }

    public function markConversationAsRead(int $conversationId): Conversation
    {
        $conversation = Conversation::findOrFail($conversationId);

        Message::where('conversation_id', $conversationId)->update([
            'is_read' => true,
            'read_at' => now(),
            'status' => 'read',
        ]);

        $conversation->update(['unread_count' => 0]);

        return $conversation->fresh(['contact', 'assignedUser']);
    }

    public function assignConversation(int $conversationId, int $userId): Conversation
    {
        return Conversation::find($conversationId)->update([
            'assigned_user_id' => $userId,
            'status' => 'open',
        ]) && Conversation::find($conversationId);
    }

    public function searchConversations(int $tenantId, string $query): Collection
    {
        return Conversation::query()
            ->where('tenant_id', $tenantId)
            ->whereHas('contact', fn($q) => $q->whereRaw("MATCH(name) AGAINST(? IN BOOLEAN MODE)", [$query]))
            ->with(['contact', 'assignedUser'])
            ->get();
    }
}
