"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
    LayoutDashboard,
    MessageSquare,
    Users,
    Radio,
    Workflow,
    Smartphone,
    Menu,
    X,
    LogOut,
    CheckCircle2,
    Clock3,
    Bot,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type AppShellProps = {
    children: ReactNode;
};

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/inbox", label: "Inbox", icon: MessageSquare },
    { href: "/contacts", label: "Contacts", icon: Users },
    { href: "/broadcasts", label: "Broadcasts", icon: Radio },
    { href: "/flows", label: "Flows", icon: Workflow },
    { href: "/devices", label: "Devices", icon: Smartphone },
    { href: "/ai-config", label: "AI Config", icon: Bot },
];

export default function AppShell({ children }: AppShellProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { user, isAuthenticated, isLoading, logout } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/auth/login");
        }
    }, [isLoading, isAuthenticated, router]);

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen((prev) => !prev)}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded"
                            aria-label="Toggle sidebar"
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <h1 className="text-2xl font-bold">TrensAI CRM</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {isLoading ? (
                            <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                                <Clock3 size={16} /> Checking session...
                            </span>
                        ) : isAuthenticated && user ? (
                            <>
                                <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
                                    <CheckCircle2 size={16} /> {user.name}
                                </span>
                                <button
                                    onClick={logout}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    <LogOut size={16} /> Logout
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/auth/login"
                                className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                            >
                                <LogOut size={16} /> Login
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            <div className="flex min-h-[calc(100vh-73px)]">
                {sidebarOpen && (
                    <aside className="w-64 bg-white border-r border-gray-200 p-6">
                        <nav className="space-y-1">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? "bg-blue-100 text-blue-900"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                            }`}
                                    >
                                        <Icon size={18} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </aside>
                )}

                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
