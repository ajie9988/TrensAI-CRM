"use client";

import AppShell from "@/components/AppShell";
import StatsCard from "@/components/StatsCard";
import { useGet, useMutate } from "@/hooks/useApi";
import { BROADCAST_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { FileText, Clock, Send, Plus, Pencil, Trash2, Play } from "lucide-react";

type Campaign = {
    id: number;
    name: string;
    recipient_count: number;
    status: "draft" | "scheduled" | "sending" | "completed" | "failed";
    scheduled_at: string | null;
    sent_at: string | null;
};

interface BroadcastsResponse { data: Campaign[] }

export default function BroadcastsPage() {
    const { data, isLoading } = useGet<BroadcastsResponse>(["broadcasts"], "/api/v1/broadcasts");

    const sendMutation = useMutate("post", (id: number) => `/api/v1/broadcasts/${id}/send`, {
        invalidateKeys: [["broadcasts"]],
    });
    const deleteMutation = useMutate("delete", (id: number) => `/api/v1/broadcasts/${id}`, {
        invalidateKeys: [["broadcasts"]],
    });

    const campaigns: Campaign[] = data?.data ?? [];

    return (
        <AppShell>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Broadcasts</h2>
                <button className="btn-primary flex items-center gap-2">
                    <Plus size={16} />
                    New Campaign
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <StatsCard label="Draft Campaigns" value={isLoading ? "..." : campaigns.filter((c) => c.status === "draft").length} icon={<FileText size={18} />} />
                <StatsCard label="Scheduled" value={isLoading ? "..." : campaigns.filter((c) => c.status === "scheduled").length} icon={<Clock size={18} />} />
                <StatsCard label="Selesai" value={isLoading ? "..." : campaigns.filter((c) => c.status === "completed").length} icon={<Send size={18} />} />
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-700">All Campaigns</h3>
                </div>

                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-left">Campaign Name</th>
                            <th className="px-6 py-3 text-left">Recipients</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-left">Scheduled / Sent At</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading && (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                        )}
                        {campaigns.map((campaign) => (
                            <tr key={campaign.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-800">{campaign.name}</td>
                                <td className="px-6 py-4 text-gray-600">{(campaign.recipient_count ?? 0).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${BROADCAST_STATUS[campaign.status]?.color ?? ""}`}>
                                        {BROADCAST_STATUS[campaign.status]?.label ?? campaign.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {campaign.sent_at ? formatDate(campaign.sent_at) : campaign.scheduled_at ? formatDate(campaign.scheduled_at) : "-"}
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    {campaign.status === "draft" && (
                                        <button
                                            onClick={() => sendMutation.mutate(campaign.id)}
                                            disabled={sendMutation.isPending}
                                            className="text-green-600 hover:text-green-800 disabled:opacity-40" title="Send now"
                                        >
                                            <Play size={14} />
                                        </button>
                                    )}
                                    <button className="text-blue-600 hover:text-blue-800"><Pencil size={14} /></button>
                                    <button
                                        onClick={() => deleteMutation.mutate(campaign.id)}
                                        disabled={deleteMutation.isPending}
                                        className="text-red-500 hover:text-red-700 disabled:opacity-40"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {campaigns.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <Send size={40} className="mx-auto mb-3 opacity-30" />
                        <p>No campaigns yet.</p>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
