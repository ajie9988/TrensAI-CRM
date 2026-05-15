import type { ReactNode } from "react";

type StatsCardProps = {
    label: string;
    value: string | number;
    icon?: ReactNode;
    description?: string;
};

export default function StatsCard({ label, value, icon, description }: StatsCardProps) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                {icon && (
                    <span className="text-gray-400">{icon}</span>
                )}
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {description && (
                <p className="text-xs text-gray-400 mt-1">{description}</p>
            )}
        </div>
    );
}
