"use client"

import { useState, useEffect } from "react";

export default function AdminMetaSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "error" | "success", text: string } | null>(null);
    const [formData, setFormData] = useState({
        appId: "",
        appSecret: "",
        systemUserToken: "",
        businessId: "",
        adAccountId: ""
    });

    useEffect(() => {
        fetch('/api/meta/settings')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setFormData({
                        appId: data.appId || "",
                        appSecret: data.appSecret || "",
                        systemUserToken: data.systemUserToken || "",
                        businessId: data.businessId || "",
                        adAccountId: data.adAccountId || ""
                    });
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch("/api/meta/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setMessage({ type: "success", text: "Settings saved successfully!" });
            } else {
                setMessage({ type: "error", text: "Failed to save settings." });
            }
        } catch (error) {
            setMessage({ type: "error", text: "An error occurred." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <div className="max-w-3xl">
            <header className="mb-8">
                <h2 className="text-2xl font-semibold text-white">Admin: Meta API Configuration</h2>
                <p className="text-slate-400 text-sm mt-1">Configure the central System User Token for automated ad creation. This is an admin control panel.</p>
            </header>

            {message && (
                <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-[#151921] rounded-xl border border-[#2A303C] p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Meta App ID</label>
                            <input
                                type="text" name="appId" value={formData.appId} onChange={handleChange}
                                className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] transition-colors"
                                placeholder="Enter App ID" required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Meta App Secret</label>
                            <input
                                type="password" name="appSecret" value={formData.appSecret} onChange={handleChange}
                                className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] transition-colors"
                                placeholder="Enter App Secret" required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">System User Token (Critical)</label>
                        <input
                            type="password" name="systemUserToken" value={formData.systemUserToken} onChange={handleChange}
                            className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] transition-colors"
                            placeholder="EAAC... token" required
                        />
                        <p className="text-xs text-slate-500 mt-2">This token will be used to execute all ad campaigns on behalf of users.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Business Manager ID</label>
                            <input
                                type="text" name="businessId" value={formData.businessId} onChange={handleChange}
                                className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] transition-colors"
                                placeholder="Enter Business ID" required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Ad Account ID</label>
                            <input
                                type="text" name="adAccountId" value={formData.adAccountId} onChange={handleChange}
                                className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] transition-colors"
                                placeholder="Example: 123456789 (without act_ prefix)" required
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[#2A303C] flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-3 bg-[#1877F2] hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg shadow-lg transition-all active:scale-95"
                        >
                            {saving ? "Saving..." : "Save Configuration"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
