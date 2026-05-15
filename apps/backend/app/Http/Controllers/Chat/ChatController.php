<?php

namespace App\Http\Controllers\Chat;

use App\Http\Controllers\Controller;
use App\Services\ChatService;
use App\DTOs\CreateMessageDTO;
use App\Jobs\ProcessMessageJob;
use App\Events\MessageCreated;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class ChatController extends Controller
{
    public function __construct(private ChatService $chatService)
    {}

    public function uploadMedia(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:20480', // Max 20MB
        ]);

        $file = $request->file('file');
        $path = $file->store('public/temp_media');
        $url = asset(str_replace('public/', 'storage/', $path));

        return response()->json([
            'url' => $url,
            'name' => $file->getClientOriginalName(),
            'type' => $file->getMimeType(),
        ]);
    }

    public function getConversations(Request $request): JsonResponse
    {
        $tenantId = $request->attributes->get('tenant_id');
        $deviceId = $request->query('device_id');

        $conversations = $this->chatService->getConversations($tenantId, $deviceId);

        return response()->json([
            'data' => $conversations,
        ]);
    }

    public function getMessages(Request $request, int $id): JsonResponse
    {
        $limit = $request->query('limit', 50);
        $offset = $request->query('offset');

        $messages = $this->chatService->getMessages($id, $limit, $offset);

        return response()->json([
            'data' => $messages,
        ]);
    }

    public function stream(Request $request): object
    {
        // Auth middleware (auth:sanctum) ensures user is authenticated
        $tenantId = $request->attributes->get('tenant_id') ?? Auth::user()->tenant_id;

        return response()->stream(function () use ($tenantId) {
            set_time_limit(0);
            echo "retry: 5000\n\n";
            ob_flush();
            flush();

            try {
                $redis = Redis::connection();
                $channel = "tenant.{$tenantId}.chat";
                $pubsub = $redis->pubSubLoop([$channel]);

                foreach ($pubsub as $message) {
                    if ($message->kind !== 'message') {
                        continue;
                    }

                    Log::debug('SSE received message from Redis', ['channel' => $channel, 'payload' => $message->payload]);

                    echo "event: chat.update\n";
                    echo 'data: ' . json_encode(json_decode($message->payload, true)) . "\n\n";
                    ob_flush();
                    flush();
                }
            } catch (\Throwable $e) {
                logger()->warning('SSE stream error', ['error' => $e->getMessage()]);
                echo "event: error\n";
                echo 'data: {"message":"Stream connection failed"}' . "\n\n";
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
        ]);
    }

    private function publishChatUpdate(int $tenantId, array $payload): void
    {
        try {
            if (config('database.redis.client') === 'mock') {
                return;
            }
            Log::debug('Publishing chat update to Redis', ['tenant_id' => $tenantId, 'payload' => $payload]);
            Redis::connection()->publish("tenant.{$tenantId}.chat", json_encode($payload));
        } catch (\Throwable $e) {
            // Silently fail if redis is down, but log for debugging
            Log::warning('Redis publish failed', ['error' => $e->getMessage()]);
        }
    }

    public function sendMessage(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'type' => 'required|in:text,image,video,audio,document',
            'media' => 'nullable|array',
        ]);

        $conversation = \App\Models\Conversation::find($id);
        $tenantId = $request->attributes->get('tenant_id');

        $messageDTO = new CreateMessageDTO(
            tenant_id: $tenantId,
            conversation_id: $conversation->id,
            device_id: $conversation->device_id,
            contact_id: $conversation->contact_id,
            user_id: $request->user()->id,
            message_id: uniqid(),
            direction: 'outgoing',
            type: $validated['type'],
            content: $validated['content'],
            media: $validated['media'] ?? null,
            status: 'pending',
        );

        $message = $this->chatService->createMessage($messageDTO->toArray());

        try {
            $this->sendOutgoingWhatsAppMessage($message);
            $message->update(['status' => 'sent']);
        } catch (\Throwable $e) {
            Log::warning('Failed to send outgoing WhatsApp message', [
                'message_id' => $message->id,
                'device_id' => $message->device_id,
                'contact_id' => $message->contact_id,
                'error' => $e->getMessage(),
            ]);
            $message->update(['status' => 'failed']);
        }

        MessageCreated::dispatch($message);
        ProcessMessageJob::dispatch($message);
        $this->publishChatUpdate($tenantId, [
            'event' => 'chat.message.created',
            'conversation_id' => $conversation->id,
            'message' => [
                'id' => $message->id,
                'content' => $message->content,
                'direction' => $message->direction,
                'created_at' => $message->created_at,
            ],
        ]);

        return response()->json([
            'data' => $message,
        ], 201);
    }

    private function sendOutgoingWhatsAppMessage(\App\Models\Message $message): void
    {
        if (!in_array($message->type, ['text', 'image', 'video', 'audio', 'document'])) {
            return;
        }

        $device = $message->device;
        $contact = $message->contact;

        if (!$device || !$contact) {
            throw new \RuntimeException('Missing device or contact for outgoing message');
        }

        $waBaseUrl = rtrim((string) config('services.wa_engine.url', ''), '/');
        $waApiKey = (string) config('services.wa_engine.key', '');

        if ($waBaseUrl === '') {
            throw new \RuntimeException('WA engine URL is not configured');
        }

        if ($message->type === 'text') {
            $endpoint = '/send-message';
            $postData = [
                'device_id' => $device->id,
                'phone' => $contact->phone_number,
                'message' => $message->content,
            ];
        } else {
            $endpoint = '/send-media';
            $postData = [
                'device_id' => $device->id,
                'phone' => $contact->phone_number,
                'media_url' => $message->media['url'] ?? null,
                'caption' => $message->content,
                'type' => $message->type,
                'mimetype' => $message->media['mimetype'] ?? null,
                'filename' => $message->media['filename'] ?? null,
            ];
        }

        $response = Http::withHeaders([
            'X-API-Key' => $waApiKey,
        ])->timeout(20)->post("{$waBaseUrl}{$endpoint}", $postData);

        if (!$response->successful()) {
            throw new \RuntimeException("WA engine send-message failed: {$response->status()} {$response->body()}");
        }
    }

    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $message = $this->chatService->markAsRead($id);

        return response()->json([
            'data' => $message,
        ]);
    }

    public function markConversationAsRead(Request $request, int $id): JsonResponse
    {
        $conversation = $this->chatService->markConversationAsRead($id);

        return response()->json([
            'data' => $conversation,
        ]);
    }

    public function assignConversation(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $conversation = $this->chatService->assignConversation($id, $validated['user_id']);

        return response()->json([
            'data' => $conversation,
        ]);
    }

    public function handleWebhook(Request $request): JsonResponse
    {
        $data  = $request->all();
        $event = $data['event'] ?? null;

        Log::info('Incoming WhatsApp webhook', [
            'event' => $event,
            'payload' => $data,
            'ip' => $request->ip(),
        ]);

        // Handle device lifecycle events from wa-engine
        if ($event) {
            return $this->handleDeviceEvent($event, $data);
        }

        // Plain incoming message payload
        $deviceId  = $data['device_id'] ?? null;
        $phone     = $data['phone_number'] ?? null;
        $content   = $data['content'] ?? '';
        $type      = $data['type'] ?? 'text';
        $direction = $data['direction'] ?? 'incoming';
        $media     = $data['media'] ?? null;
        $messageId = $data['message_id'] ?? null;
        $timestamp = isset($data['timestamp'])
            ? \Carbon\Carbon::createFromTimestampMs($data['timestamp'])
            : now();

        if (!$deviceId || !$phone) {
            return response()->json(['error' => 'device_id and phone_number required'], 422);
        }

        $device = \App\Models\Device::where('id', $deviceId)->first();
        if (!$device) {
            return response()->json(['error' => 'Unknown device'], 404);
        }

        $tenantId = $device->tenant_id;
        // Clean phone number from common WA suffixes, but keep @g.us for groups
        if (str_ends_with($phone, '@g.us')) {
            $cleanPhone = $phone;
        } else {
            $cleanPhone = preg_replace('/@.*$/', '', $phone);
        }

        $contact = \App\Models\Contact::firstOrCreate(
            ['phone_number' => $cleanPhone, 'tenant_id' => $tenantId],
            ['name' => $cleanPhone, 'tenant_id' => $tenantId]
        );

        $conversation = \App\Models\Conversation::firstOrCreate(
            ['tenant_id' => $tenantId, 'contact_id' => $contact->id, 'device_id' => $deviceId],
            [
                'tenant_id'    => $tenantId,
                'contact_id'   => $contact->id,
                'device_id'    => $deviceId,
                'conversation_id' => 'conv_' . $tenantId . '_' . $deviceId . '_' . $contact->id,
                'status'       => 'open',
                'unread_count' => 0,
            ]
        );

        $safeType = in_array($type, ['text', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'contact', 'reaction', 'button', 'list', 'poll'], true)
            ? $type
            : 'text';

        $message = \App\Models\Message::create([
            'tenant_id'       => $tenantId,
            'conversation_id' => $conversation->id,
            'contact_id'      => $contact->id,
            'device_id'       => $deviceId,
            'message_id'      => $messageId ?: uniqid('wa_', true),
            'content'         => $content ?: '',
            'type'            => $safeType,
            'media'           => $media,
            'direction'       => $direction,
            'status'          => 'delivered',
        ]);

        if ($direction === 'incoming') {
            $conversation->increment('unread_count');
        }
        $conversation->update(['last_message_at' => $timestamp]);

        ProcessMessageJob::dispatch($message);
        broadcast(new MessageCreated($message))->toOthers();
        $this->publishChatUpdate($tenantId, [
            'event' => 'chat.message.created',
            'conversation_id' => $conversation->id,
            'message' => [
                'id' => $message->id,
                'content' => $message->content,
                'direction' => $message->direction,
                'created_at' => $message->created_at,
            ],
        ]);

        return response()->json(['status' => 'received', 'message_id' => $message->id]);
    }

    private function handleDeviceEvent(string $event, array $data): JsonResponse
    {
        $deviceId = $data['device_id'] ?? null;
        if (!$deviceId) return response()->json(['status' => 'ignored']);

        $device = \App\Models\Device::find($deviceId);
        if (!$device) return response()->json(['status' => 'unknown_device']);

        match ($event) {
            'device.connected'    => $device->update([
                'status'       => 'connected',
                'phone_number' => $data['phone_number'] ?? $device->phone_number,
                'last_connected_at' => now(),
                'last_activity_at' => now(),
            ]),
            'device.disconnected' => $device->update([
                'status' => $data['status'] ?? 'disconnected',
                'last_activity_at' => now(),
            ]),
            'device.qr'           => $device->update([
                'status' => 'connecting',
                'last_activity_at' => now(),
            ]),
            default               => null,
        };

        return response()->json(['status' => 'ok', 'event' => $event]);
    }

    public function handleAIWebhook(Request $request): JsonResponse
    {
        // TODO: Implement AI webhook handling

        return response()->json(['status' => 'received']);
    }
}
