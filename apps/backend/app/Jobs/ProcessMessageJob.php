<?php

namespace App\Jobs;

use App\Models\Message;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessMessageJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public Message $message) {}

    public function handle(): void
    {
        $this->message->loadMissing(['conversation', 'contact', 'device']);

        $conversation = $this->message->conversation;
        $contact = $this->message->contact;
        $device = $this->message->device;

        if (!$conversation || !$contact || !$device) {
            return;
        }

        // Update contact activity
        $contact->update([
            'last_message_at' => now(),
            'message_count'   => \DB::raw('message_count + 1'),
        ]);

        // Trigger active automation flows
        \Modules\Flow\Services\FlowService::dispatchForMessage(
            $this->message,
            $conversation,
            $contact,
            $device,
        );

        // --- AI AUTO-REPLY LOGIC ---
        // Only trigger if device has AI enabled and it's an incoming message
        if ($device->is_ai_enabled && $this->message->direction === 'incoming') {
            try {
                \Illuminate\Support\Facades\Log::info("Triggering AI Auto-reply for Device: {$device->id}");
                
                // Fetch recent conversation context (last 10 messages)
                $recentMessages = \App\Models\Message::where('conversation_id', $conversation->id)
                    ->orderBy('created_at', 'desc')
                    ->take(10)
                    ->get()
                    ->reverse()
                    ->map(function ($msg) {
                        return [
                            'role' => $msg->direction === 'incoming' ? 'user' : 'assistant',
                            'content' => $msg->content
                        ];
                    })
                    ->values()
                    ->toArray();

                $aiService = app(\Modules\AI\Services\AIService::class);
                $replyData = $aiService->generateReply(
                    $device->tenant_id, 
                    $this->message->content, 
                    $recentMessages, 
                    null, 
                    $contact->id
                );

                if (!empty($replyData['content'])) {
                    // Save AI reply to database
                    $aiMessage = \App\Models\Message::create([
                        'tenant_id' => $device->tenant_id,
                        'conversation_id' => $conversation->id,
                        'contact_id' => $contact->id,
                        'device_id' => $device->id,
                        'message_id' => uniqid('wa_ai_', true),
                        'content' => $replyData['content'],
                        'type' => 'text',
                        'direction' => 'outgoing',
                        'status' => 'pending',
                    ]);
                    
                    $conversation->update(['last_message_at' => now(), 'unread_count' => 0]);

                    // Send to WA Engine
                    $waBaseUrl = rtrim((string) config('services.wa_engine.url', ''), '/');
                    $waApiKey = (string) config('services.wa_engine.key', '');

                    if ($waBaseUrl !== '') {
                        $response = \Illuminate\Support\Facades\Http::withHeaders([
                            'X-API-Key' => $waApiKey,
                        ])->timeout(20)->post("{$waBaseUrl}/send-message", [
                            'device_id' => $device->id,
                            'phone' => $contact->phone_number,
                            'message' => $replyData['content'],
                        ]);

                        if ($response->successful()) {
                            $aiMessage->update(['status' => 'sent']);
                            \Illuminate\Support\Facades\Log::info("AI Auto-reply sent successfully.");
                        } else {
                            $aiMessage->update(['status' => 'failed']);
                            \Illuminate\Support\Facades\Log::error("WA engine failed to send AI reply: " . $response->body());
                        }
                    }
                }

            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("AI Auto-reply failed: " . $e->getMessage());
            }
        }
    }
}
