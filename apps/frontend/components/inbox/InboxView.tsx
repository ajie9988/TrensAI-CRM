"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import AppShell from "@/components/AppShell";
import StatsCard from "@/components/StatsCard";
import { useGet, useMutate } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { CONVERSATION_STATUS } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import { Inbox, BellDot, UserCheck, Search, MessageCircle, X, Send, Paperclip, Image as ImageIcon, Loader2, FileText, Download, Play, Headphones, Sparkles } from "lucide-react";

type Message = {
    id: number;
    content: string;
    type: string;
    media?: { url: string } | null;
    direction: "incoming" | "outgoing";
    created_at: string;
};

type Conversation = {
    id: number;
    contact_id: number;
    contact?: { name: string; phone_number: string };
    last_message?: string;
    messages?: Message[];
    status: "open" | "resolved" | "waiting";
    unread_count: number;
    updated_at: string;
};

interface ConversationsResponse { data: Conversation[] }

interface MessagesResponse { data: Message[] }

type Props = {
    initialConversationId?: number | null;
};

export default function InboxView({ initialConversationId = null }: Props) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [replyText, setReplyText] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [pendingMedia, setPendingMedia] = useState<{ url: string; type: string; name: string; mimetype: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const debouncedSearch = useDebounce(search, 400);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const realtimeMethod = process.env.NEXT_PUBLIC_CHAT_REALTIME_METHOD || "sse";
    const isPolling = realtimeMethod === "polling";

    const { data, isLoading } = useGet<ConversationsResponse>(
        ["conversations", debouncedSearch],
        `/api/v1/chat/conversations?q=${debouncedSearch}`,
        {
            refetchInterval: isPolling ? 1500 : false,
        }
    );

    const conversations: Conversation[] = data?.data ?? [];
    const selectedId = selectedConversation?.id;

    const { data: messageData, isLoading: isMessagesLoading } = useGet<MessagesResponse>(
        ["conversation-messages", selectedId],
        selectedId ? `/api/v1/chat/conversations/${selectedId}/messages?limit=50` : "/api/v1/chat/conversations/0/messages?limit=50",
        {
            enabled: !!selectedId,
            refetchInterval: isPolling ? 1500 : false,
        }
    );

    const messages = messageData?.data ?? [];

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages.length]);

    const sendMutation = useMutate<{ data: unknown }, { 
        content: string; 
        type: "text" | "image" | "video" | "audio" | "document"; 
        media?: { url: string; filename?: string; mimetype?: string } 
    }>(
        "post",
        () => `/api/v1/chat/conversations/${selectedId}/messages`,
        {
            invalidateKeys: [["conversation-messages", selectedId], ["conversations", debouncedSearch]],
            onSuccess: () => {
                setReplyText("");
            },
        }
    );

    const markReadMutation = useMutate<{ data: Conversation }, void>(
        "put",
        () => `/api/v1/chat/conversations/${selectedId}/read`,
        {
            invalidateKeys: [["conversations", debouncedSearch], ["conversation-messages", selectedId]],
        }
    );

    const filtered = conversations.filter((c) => {
        const name = c.contact?.name ?? "";
        const msg = c.last_message ?? "";
        return (
            name.toLowerCase().includes(search.toLowerCase()) ||
            msg.toLowerCase().includes(search.toLowerCase())
        );
    });

    const selectedConversationLabel = useMemo(() => {
        if (!selectedConversation) return "";
        return selectedConversation.contact?.name || selectedConversation.contact?.phone_number || `Conversation #${selectedConversation.id}`;
    }, [selectedConversation]);

    useEffect(() => {
        if (!initialConversationId) return;
        const conversation = conversations.find((item) => item.id === initialConversationId);
        if (conversation) {
            setSelectedConversation(conversation);
        }
    }, [initialConversationId, conversations]);

    useEffect(() => {
        if (selectedId) {
            markReadMutation.mutate(undefined);
        }
    }, [selectedId]);

    useEffect(() => {
        if (typeof window === "undefined" || isPolling) return;
        const token = localStorage.getItem("auth_token");
        if (!token) return;

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const source = new EventSource(`${baseUrl}/api/v1/chat/stream?token=${encodeURIComponent(token)}`);

        source.addEventListener("chat.update", (event) => {
            try {
                const payload = JSON.parse((event as MessageEvent).data);
                queryClient.invalidateQueries({ queryKey: ["conversations", debouncedSearch] });
                if (selectedId && payload.conversation_id === selectedId) {
                    queryClient.invalidateQueries({ queryKey: ["conversation-messages", selectedId] });
                }
            } catch {
                queryClient.invalidateQueries({ queryKey: ["conversations", debouncedSearch] });
                if (selectedId) {
                    queryClient.invalidateQueries({ queryKey: ["conversation-messages", selectedId] });
                }
            }
        });

        source.onerror = () => {
            // Browser will retry automatically; no further action needed here.
        };

        return () => {
            source.close();
        };
    }, [debouncedSearch, queryClient, selectedId]);

    return (
        <AppShell>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Inbox</h2>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.5fr] gap-6 items-start">
                <div className="min-w-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <StatsCard label="Open Conversations" value={isLoading ? "..." : conversations.filter((c) => c.status === "open").length} icon={<Inbox size={18} />} />
                        <StatsCard label="Unread Messages" value={isLoading ? "..." : conversations.reduce((a, c) => a + (c.unread_count ?? 0), 0)} icon={<BellDot size={18} />} />
                        <StatsCard label="Menunggu" value={isLoading ? "..." : conversations.filter((c) => c.status === "waiting").length} icon={<UserCheck size={18} />} />
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                            <div className="relative flex-1 max-w-xs">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search conversations..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Contact</th>
                                        <th className="px-6 py-3 text-left">Last Message</th>
                                        <th className="px-6 py-3 text-left">Status</th>
                                        <th className="px-6 py-3 text-left">Unread</th>
                                        <th className="px-6 py-3 text-left">Time</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {isLoading && (
                                        <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                                    )}
                                    {filtered.map((conv) => (
                                        <tr
                                            key={conv.id}
                                            className={`hover:bg-gray-50 cursor-pointer ${selectedConversation?.id === conv.id ? "bg-blue-50/60" : ""}`}
                                            onClick={() => setSelectedConversation(conv)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-800 whitespace-nowrap">{conv.contact?.name ?? "-"}</div>
                                                <div className="text-xs text-gray-400 whitespace-nowrap">{conv.contact?.phone_number ?? ""}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">
                                                {conv.messages && conv.messages.length > 0 
                                                    ? conv.messages[0].content 
                                                    : (conv.last_message ?? "-")}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${CONVERSATION_STATUS[conv.status]?.color ?? ""}`}>
                                                    {CONVERSATION_STATUS[conv.status]?.label ?? conv.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {(conv.unread_count ?? 0) > 0 && (
                                                    <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs">{conv.unread_count}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{timeAgo(conv.updated_at)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedConversation(conv);
                                                        router.push(`/inbox/${conv.id}`);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 flex items-center justify-end gap-1 ml-auto text-xs whitespace-nowrap"
                                                >
                                                    <MessageCircle size={14} /> Open
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filtered.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                <Inbox size={40} className="mx-auto mb-3 opacity-30" />
                                <p>No conversations found.</p>
                            </div>
                        )}
                    </div>
                </div>

                <aside className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden min-h-[420px] sticky top-6 min-w-0">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-widest text-gray-400">Conversation Detail</p>
                            <h3 className="font-semibold text-gray-900">{selectedConversationLabel || "Select a conversation"}</h3>
                        </div>
                        {selectedConversation && (
                            <button
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                                onClick={() => setSelectedConversation(null)}
                                aria-label="Close conversation detail"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div className="p-5">
                        {!selectedConversation && (
                            <div className="text-sm text-gray-500 text-center py-16">
                                Pilih percakapan dari daftar untuk melihat isi pesan.
                            </div>
                        )}

                        {selectedConversation && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Status</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${CONVERSATION_STATUS[selectedConversation.status]?.color ?? ""}`}>
                                        {CONVERSATION_STATUS[selectedConversation.status]?.label ?? selectedConversation.status}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Unread</span>
                                    <span className="font-semibold text-gray-900">{selectedConversation.unread_count}</span>
                                </div>

                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Messages</p>
                                    {isMessagesLoading && <div className="text-sm text-gray-400">Loading messages...</div>}
                                    {!isMessagesLoading && messages.length === 0 && (
                                        <div className="text-sm text-gray-500">Belum ada pesan untuk percakapan ini.</div>
                                    )}
                                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                                        {messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`rounded-2xl px-4 py-3 text-sm border ${message.direction === "outgoing"
                                                    ? "ml-auto bg-blue-600 text-white border-blue-600"
                                                    : "bg-gray-50 text-gray-800 border-gray-200"
                                                    } max-w-[85%]`}
                                            >
                                                {message.type === "image" && message.media?.url && (
                                                    <div className="mb-2 overflow-hidden rounded-lg">
                                                        <img src={message.media.url} alt="Shared image" className="max-w-full h-auto object-cover" />
                                                    </div>
                                                )}
                                                {message.type === "video" && message.media?.url && (
                                                    <div className="mb-2 overflow-hidden rounded-lg">
                                                        <video src={message.media.url} controls className="max-w-full h-auto" />
                                                    </div>
                                                )}
                                                {message.type === "audio" && message.media?.url && (
                                                    <div className="mb-2">
                                                        <audio src={message.media.url} controls className="w-full h-8" />
                                                    </div>
                                                )}
                                                {message.type === "document" && message.media?.url && (
                                                    <div className={`mb-2 p-3 rounded-xl border flex items-center gap-3 ${message.direction === "outgoing" ? "bg-blue-500/20 border-blue-400/30" : "bg-gray-100 border-gray-200"}`}>
                                                        <div className={`p-2 rounded-lg ${message.direction === "outgoing" ? "bg-blue-500" : "bg-white text-gray-400"}`}>
                                                            <FileText size={20} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-xs font-medium truncate ${message.direction === "outgoing" ? "text-white" : "text-gray-800"}`}>
                                                                {message.content || "Document"}
                                                            </p>
                                                            <a 
                                                                href={message.media.url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className={`text-[10px] flex items-center gap-1 hover:underline ${message.direction === "outgoing" ? "text-blue-100" : "text-blue-600"}`}
                                                            >
                                                                <Download size={10} /> Download File
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                                <p className={`mt-2 text-[11px] ${message.direction === "outgoing" ? "text-blue-100" : "text-gray-400"}`}>
                                                    {timeAgo(message.created_at)} • {message.direction === "outgoing" ? "Out" : "In"}
                                                </p>
                                            </div>
                                        ))}
                                    <div ref={messagesEndRef} />
                                    </div>

                                    <form
                                        className="mt-4 space-y-3"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            if (!selectedId || (!replyText.trim() && !pendingMedia)) return;
                                            
                                            if (pendingMedia) {
                                                sendMutation.mutate({ 
                                                    content: replyText.trim() || pendingMedia.name, 
                                                    type: pendingMedia.type as any,
                                                    media: { 
                                                        url: pendingMedia.url,
                                                        filename: pendingMedia.name,
                                                        mimetype: pendingMedia.mimetype
                                                    }
                                                });
                                                setPendingMedia(null);
                                            } else {
                                                sendMutation.mutate({ content: replyText.trim(), type: "text" });
                                            }
                                        }}
                                    >
                                        {pendingMedia && (
                                            <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded-xl mb-2">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                                    <Paperclip size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-blue-800 truncate">{pendingMedia.name}</p>
                                                    <p className="text-[10px] text-blue-500 uppercase">{pendingMedia.type}</p>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setPendingMedia(null)}
                                                    className="p-1 hover:bg-blue-200 rounded-full text-blue-400"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                        <div className="relative">
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Tulis balasan..."
                                                className="w-full min-h-[96px] rounded-2xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <div className="absolute right-3 bottom-3 flex items-center gap-2">
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        
                                                        setIsUploading(true);
                                                        const formData = new FormData();
                                                        formData.append("file", file);
                                                        
                                                        try {
                                                            const token = localStorage.getItem("auth_token");
                                                            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                                                            const res = await fetch(`${baseUrl}/api/v1/chat/upload`, {
                                                                method: "POST",
                                                                headers: { "Authorization": `Bearer ${token}` },
                                                                body: formData
                                                            });
                                                            const data = await res.json();
                                                            
                                                            if (data.url) {
                                                                let type = "document";
                                                                if (data.type.startsWith("image/")) type = "image";
                                                                else if (data.type.startsWith("video/")) type = "video";
                                                                else if (data.type.startsWith("audio/")) type = "audio";
                                                                
                                                                setPendingMedia({
                                                                    url: data.url,
                                                                    type: type,
                                                                    name: data.name,
                                                                    mimetype: data.type
                                                                });
                                                            }
                                                        } catch (err) {
                                                            console.error("Upload failed", err);
                                                        } finally {
                                                            setIsUploading(false);
                                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    disabled={isUploading}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
                                                    title="Upload media"
                                                >
                                                    {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs text-gray-400">Gunakan klip untuk kirim gambar/file.</p>                                                <button
                                                    type="button"
                                                    disabled={isGeneratingAI || !selectedConversation}
                                                    onClick={async () => {
                                                        const currentConv = selectedConversation;
                                                        if (!currentConv) return;

                                                        const lastMessage = messages[messages.length - 1];
                                                        if (!lastMessage) {
                                                            alert("Belum ada pesan dalam percakapan ini.");
                                                            return;
                                                        }

                                                        setIsGeneratingAI(true);
                                                        try {
                                                            // Robust URL detection for MAMP/Local environments
                                                            let baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                                                            const token = localStorage.getItem("auth_token");
                                                            
                                                            if (!token) {
                                                                setReplyText("⚠️ Sesi habis. Silakan login kembali.");
                                                                return;
                                                            }

                                                            console.log("Attempting AI Request to:", `${baseUrl}/api/v1/ai/generate-reply`);

                                                            const res = await fetch(`${baseUrl}/api/v1/ai/generate-reply`, {
                                                                method: "POST",
                                                                headers: { 
                                                                    "Authorization": `Bearer ${token}`,
                                                                    "Content-Type": "application/json",
                                                                    "Accept": "application/json",
                                                                    "X-Requested-With": "XMLHttpRequest"
                                                                },
                                                                body: JSON.stringify({
                                                                    message: lastMessage.content,
                                                                    context: messages.slice(-10).map(m => ({ 
                                                                        role: m.direction === "incoming" ? "user" : "assistant", 
                                                                        content: m.content 
                                                                    })),
                                                                    provider: "gemini",
                                                                    contact_id: currentConv.contact_id
                                                                })
                                                            });
                                                            
                                                            if (!res.ok) {
                                                                const errData = await res.json().catch(() => ({}));
                                                                throw new Error(errData.message || `Server Error: ${res.status}`);
                                                            }
                                                            
                                                            const data = await res.json();
                                                            const content = data.data?.content || data.content || (data.data && typeof data.data === 'string' ? data.data : null);
                                                            
                                                            if (content) {
                                                                setReplyText(content);
                                                            } else {
                                                                console.log("AI Data Received:", data);
                                                                throw new Error("AI tidak memberikan balasan teks.");
                                                            }
                                                        } catch (err: any) {
                                                            console.error("AI Reply Error:", err);
                                                            setReplyText(`⚠️ AI Error: ${err.message}`);
                                                        } finally {
                                                            setIsGeneratingAI(false);
                                                        }
                                                    }}
                                                    className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md transition-colors disabled:opacity-50 ${isGeneratingAI ? 'bg-purple-200 text-purple-800' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
                                                >
                                                    {isGeneratingAI ? (
                                                        <>
                                                            <Loader2 size={12} className="animate-spin" />
                                                            <span>Generating...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles size={12} />
                                                            <span>AI Reply</span>
                                                        </>
                                                    )}
                                                </button>

                                            </div>
                                            <button
                                                type="submit"
                                                disabled={(!replyText.trim() && !pendingMedia) || sendMutation.isPending || isUploading}
                                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <Send size={14} />
                                                {sendMutation.isPending ? "Sending..." : "Send"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </AppShell>
    );
}
