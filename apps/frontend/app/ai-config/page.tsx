"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { aiService } from "@/services/api";
import {
    Plus,
    Trash2,
    Edit2,
    CheckCircle,
    Settings,
    AlertCircle,
    Save,
    X,
    ExternalLink,
    Key,
    Cpu,
    Activity
} from "lucide-react";

interface AIConfig {
    id: number;
    name: string;
    ai_provider: string;
    ai_model: string;
    api_key: string | null;
    base_url: string | null;
    system_instruction: string | null;
    temperature: number;
    max_output_tokens: number;
    is_active: boolean;
}

export default function AIConfigPage() {
    const [configs, setConfigs] = useState<AIConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        ai_provider: "gemini",
        ai_model: "gemini-1.5-flash",
        api_key: "",
        base_url: "",
        system_instruction: "",
        temperature: 0.7,
        max_output_tokens: 2000,
        is_active: false,
    });

    const providers = [
        { id: "gemini", name: "Google Gemini", models: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-2.5-flash"] },
        { id: "openai", name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4", "gpt-3.5-turbo"] },
        { id: "anthropic", name: "Anthropic Claude", models: ["claude-3-5-sonnet-20240620", "claude-3-opus-20240229", "claude-3-haiku-20240307"] },
        { id: "ollama", name: "Ollama (Local)", models: ["llama3", "mistral", "phi3"] },
    ];

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const response = await aiService.getConfigs();
            setConfigs(response.data.data);
        } catch (error) {
            console.error("Failed to fetch AI configs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (config: AIConfig | null = null) => {
        if (config) {
            setEditingConfig(config);
            setFormData({
                name: config.name,
                ai_provider: config.ai_provider,
                ai_model: config.ai_model,
                api_key: config.api_key || "",
                base_url: config.base_url || "",
                system_instruction: config.system_instruction || "",
                temperature: config.temperature,
                max_output_tokens: config.max_output_tokens,
                is_active: config.is_active,
            });
        } else {
            setEditingConfig(null);
            setFormData({
                name: "",
                ai_provider: "gemini",
                ai_model: "gemini-1.5-flash",
                api_key: "",
                base_url: "",
                system_instruction: "",
                temperature: 0.7,
                max_output_tokens: 2000,
                is_active: configs.length === 0,
            });
        }
        setModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingConfig) {
                await aiService.updateConfig(editingConfig.id, formData);
            } else {
                await aiService.createConfig(formData);
            }
            setModalOpen(false);
            fetchConfigs();
        } catch (error) {
            console.error("Failed to save config", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this configuration?")) {
            try {
                await aiService.deleteConfig(id);
                fetchConfigs();
            } catch (error) {
                alert("Failed to delete. Make sure it's not the active configuration.");
            }
        }
    };

    const handleToggleActive = async (id: number) => {
        try {
            await aiService.toggleActive(id);
            fetchConfigs();
        } catch (error) {
            console.error("Failed to toggle active", error);
        }
    };

    return (
        <AppShell>
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">AI Configurations</h1>
                        <p className="text-gray-500 mt-1">Manage multiple AI models and personas for your CRM</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm"
                    >
                        <Plus size={20} /> Add Configuration
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : configs.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-300 p-12 text-center">
                        <Cpu className="mx-auto text-gray-400 mb-4" size={48} />
                        <h3 className="text-lg font-medium text-gray-900">No configurations found</h3>
                        <p className="text-gray-500 mb-6">Create your first AI configuration to start using AI features.</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                        >
                            <Plus size={20} /> Get Started
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {configs.map((config) => (
                            <div
                                key={config.id}
                                className={`bg-white rounded-xl shadow-sm border-2 transition-all relative overflow-hidden ${config.is_active ? "border-blue-500 ring-4 ring-blue-50" : "border-gray-100"
                                    }`}
                            >
                                {config.is_active && (
                                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 shadow-sm z-10">
                                        <CheckCircle size={10} /> Active
                                    </div>
                                )}

                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${config.ai_provider === 'gemini' ? 'bg-orange-50 text-orange-600' :
                                                    config.ai_provider === 'openai' ? 'bg-green-50 text-green-600' :
                                                        config.ai_provider === 'anthropic' ? 'bg-purple-50 text-purple-600' :
                                                            'bg-gray-50 text-gray-600'
                                                }`}>
                                                <Cpu size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 leading-tight">{config.name}</h3>
                                                <p className="text-xs text-gray-500 capitalize">{config.ai_provider} • {config.ai_model}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Activity size={14} className="text-gray-400" />
                                            <span>Temp: {config.temperature}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <AlertCircle size={14} className="text-gray-400" />
                                            <span>Tokens: {config.max_output_tokens}</span>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-500 italic line-clamp-2 border-l-2 border-gray-100 pl-3">
                                            "{config.system_instruction || 'No system instruction set'}"
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                                        {!config.is_active && (
                                            <button
                                                onClick={() => handleToggleActive(config.id)}
                                                className="flex-1 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 py-2 rounded-lg transition-colors"
                                            >
                                                Set Active
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleOpenModal(config)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="Edit"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        {!config.is_active && (
                                            <button
                                                onClick={() => handleDelete(config.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <Settings size={20} />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {editingConfig ? "Edit Configuration" : "New AI Configuration"}
                                    </h2>
                                </div>
                                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            Configuration Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Sales Assistant Gemini"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">AI Provider</label>
                                        <select
                                            value={formData.ai_provider}
                                            onChange={(e) => {
                                                const provider = providers.find(p => p.id === e.target.value);
                                                setFormData({
                                                    ...formData,
                                                    ai_provider: e.target.value,
                                                    ai_model: provider?.models[0] || ""
                                                });
                                            }}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all appearance-none bg-no-repeat bg-[right_1rem_center]"
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='gray'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1.25rem' }}
                                        >
                                            {providers.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Model</label>
                                        <select
                                            value={formData.ai_model}
                                            onChange={(e) => setFormData({ ...formData, ai_model: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all appearance-none bg-no-repeat bg-[right_1rem_center]"
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='gray'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1.25rem' }}
                                        >
                                            {providers.find(p => p.id === formData.ai_provider)?.models.map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                            <option value="custom">Custom Model Name...</option>
                                        </select>
                                        {formData.ai_model === 'custom' && (
                                            <input
                                                type="text"
                                                placeholder="Enter model name"
                                                className="mt-2 w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                                onChange={(e) => setFormData({ ...formData, ai_model: e.target.value })}
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Key size={14} /> API Key (Optional)
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.api_key}
                                            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                                            placeholder="Defaults to server env key"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <ExternalLink size={14} /> Custom Base URL (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.base_url}
                                            onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                                            placeholder="e.g., http://localhost:11434"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-semibold text-gray-700">System Instruction / Persona</label>
                                        <textarea
                                            rows={4}
                                            value={formData.system_instruction}
                                            onChange={(e) => setFormData({ ...formData, system_instruction: e.target.value })}
                                            placeholder="Tell the AI how to behave..."
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none"
                                        ></textarea>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-sm font-semibold text-gray-700">Temperature: {formData.temperature}</label>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={formData.temperature}
                                            onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                        <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                            <span>Precise</span>
                                            <span>Creative</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Max Tokens</label>
                                        <input
                                            type="number"
                                            value={formData.max_output_tokens}
                                            onChange={(e) => setFormData({ ...formData, max_output_tokens: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-gray-100 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(false)}
                                        className="px-6 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-2.5 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                                    >
                                        <Save size={18} /> Save Configuration
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
