"use client";

import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import StatsCard from "@/components/StatsCard";
import { useGet } from "@/hooks/useApi";
import { MessageSquare, Users, Inbox, Smartphone } from "lucide-react";

interface Overview {
    data: {
        total_messages: number;
        total_contacts: number;
        open_conversations: number;
        active_devices: number;
    };
}

export default function DashboardPage() {
    const router = useRouter();
    const { data, isLoading } = useGet<Overview>(["analytics", "overview"], "/api/v1/analytics/overview");

    const stats = data?.data;

    return (
        <AppShell>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard label="Total Messages" value={isLoading ? "..." : (stats?.total_messages ?? 0)} icon={<MessageSquare size={18} />} description="All time" />
                <StatsCard label="Active Contacts" value={isLoading ? "..." : (stats?.total_contacts ?? 0)} icon={<Users size={18} />} description="In your workspace" />
                <StatsCard label="Open Conversations" value={isLoading ? "..." : (stats?.open_conversations ?? 0)} icon={<Inbox size={18} />} description="Pending reply" />
                <StatsCard label="Active Devices" value={isLoading ? "..." : (stats?.active_devices ?? 0)} icon={<Smartphone size={18} />} description="Connected" />
            </div>

            <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Quick Start</h2>
                <div className="space-y-3">
                    <button onClick={() => router.push("/devices")} className="w-full btn-primary text-left">📱 Connect WhatsApp Device</button>
                    <button onClick={() => router.push("/contacts")} className="w-full btn-secondary text-left">📋 Import Contacts</button>
                    <button onClick={() => router.push("/flows")} className="w-full btn-secondary text-left">🚀 Create First Flow</button>
                </div>
            </div>
        </AppShell>
    );
}
