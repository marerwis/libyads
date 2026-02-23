"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [pages, setPages] = useState<any[]>([]);
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "error" | "success", text: string } | null>(null);

    const [formData, setFormData] = useState({
        pageId: "",
        postId: "",
        budget: 10,
        duration: 3
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch stats (for balance), pages, and campaigns concurrently
                const [statsRes, pagesRes, campaignsRes] = await Promise.all([
                    fetch('/api/dashboard/stats'),
                    fetch('/api/facebook/pages'),
                    fetch('/api/campaign/list')
                ]);

                const statsData = await statsRes.json();
                setBalance(statsData.balance || 0);

                const pagesData = await pagesRes.json();
                if (Array.isArray(pagesData)) {
                    setPages(pagesData);
                    if (pagesData.length > 0) {
                        setFormData(prev => ({ ...prev, pageId: pagesData[0].pageId }));
                    }
                }

                const campaignsData = await campaignsRes.json();
                if (Array.isArray(campaignsData)) setCampaigns(campaignsData);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "budget" || name === "duration" ? Number(value) : value
        }));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.budget > balance) {
            setMessage({ type: "error", text: "Insufficient balance to run this campaign." });
            return;
        }

        setSubmitting(true);
        setMessage(null);

        try {
            const res = await fetch("/api/campaign/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: "success", text: "Campaign created and activated successfully!" });
                setFormData(prev => ({ ...prev, postId: "" })); // reset post ID

                // Refresh campaigns and balance
                const [newStats, newCampaigns] = await Promise.all([
                    fetch('/api/dashboard/stats').then(r => r.json()),
                    fetch('/api/campaign/list').then(r => r.json())
                ]);
                setBalance(newStats.balance || 0);
                if (Array.isArray(newCampaigns)) setCampaigns(newCampaigns);

            } else {
                setMessage({ type: "error", text: data.error || "Failed to create campaign." });
            }
        } catch (error) {
            setMessage({ type: "error", text: "A critical error occurred." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-semibold text-white">Ad Campaigns</h2>
                    <p className="text-slate-400 text-sm mt-1">Create new promotions and monitor active campaigns.</p>
                </div>
                <div className="text-right">
                    <p className="text-slate-400 text-sm">Wallet Balance</p>
                    <p className="text-xl font-bold text-white">${balance.toFixed(2)}</p>
                </div>
            </header>

            {message && (
                <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Campaign Form */}
                <div className="lg:col-span-1">
                    <div className="bg-[#151921] rounded-xl border border-[#2A303C] p-6 shadow-sm sticky top-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2A303C]">
                            <div className="w-10 h-10 rounded-lg bg-blue-900/20 flex items-center justify-center text-[#1877F2]">
                                <span className="material-symbols-outlined">add_circle</span>
                            </div>
                            <h3 className="text-lg font-medium text-white">Create Promotion</h3>
                        </div>

                        {loading ? (
                            <div className="text-sm text-slate-400">Loading form...</div>
                        ) : pages.length === 0 ? (
                            <div className="text-sm text-amber-400 bg-amber-900/20 p-4 rounded-lg border border-amber-900/50 mb-4">
                                You must connect a Facebook Page in the "Pages" section before creating a promotion.
                            </div>
                        ) : (
                            <form onSubmit={handleCreate} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Target Facebook Page</label>
                                    <select
                                        name="pageId" value={formData.pageId} onChange={handleChange}
                                        className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#1877F2] text-sm"
                                        required
                                    >
                                        {pages.map(page => (
                                            <option key={page.id} value={page.pageId}>{page.pageName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Post ID (Object Story)</label>
                                    <input
                                        type="text" name="postId" value={formData.postId} onChange={handleChange}
                                        className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#1877F2] text-sm"
                                        placeholder="Enter the Facebook Post ID" required
                                    />
                                    <p className="text-xs text-slate-500 mt-1">We will promote this specific post.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Budget ($)</label>
                                        <input
                                            type="number" name="budget" value={formData.budget} onChange={handleChange} min="1" max={Math.floor(balance)}
                                            className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#1877F2] text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Duration (Days)</label>
                                        <input
                                            type="number" name="duration" value={formData.duration} onChange={handleChange} min="1" max="30"
                                            className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#1877F2] text-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={submitting || formData.budget > balance || pages.length === 0}
                                        className="w-full px-4 py-3 bg-[#1877F2] hover:bg-blue-600 disabled:bg-[#151921] disabled:border disabled:border-[#2A303C] disabled:text-slate-500 text-white font-medium rounded-lg text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            "Executing with Meta..."
                                        ) : formData.budget > balance ? (
                                            "Insufficient Balance"
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                                Launch Promotion
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Campaigns List */}
                <div className="lg:col-span-2">
                    <div className="bg-[#151921] rounded-xl border border-[#2A303C] overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-[#2A303C] flex justify-between items-center">
                            <h3 className="text-lg font-medium text-white">Campaign History</h3>
                        </div>

                        {loading ? (
                            <div className="p-8 text-center text-slate-400">Loading campaigns...</div>
                        ) : campaigns.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2] mb-4">
                                    <span className="material-symbols-outlined text-3xl">campaign</span>
                                </div>
                                <h3 className="text-white font-medium mb-1">No campaigns found</h3>
                                <p className="text-slate-400 text-sm max-w-sm">Create your first promotion using the form to see your campaign history here.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="text-xs text-slate-400 uppercase bg-[#0B0E14]/50 border-b border-[#2A303C]">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">Campaign ID</th>
                                            <th className="px-6 py-4 font-medium">Budget</th>
                                            <th className="px-6 py-4 font-medium">Status</th>
                                            <th className="px-6 py-4 font-medium">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2A303C]">
                                        {campaigns.map(campaign => (
                                            <tr key={campaign.id} className="hover:bg-[#0B0E14]/30 transition-colors">
                                                <td className="px-6 py-4 font-mono text-xs">{campaign.campaignId || 'Pending'}</td>
                                                <td className="px-6 py-4 font-medium">${campaign.budget.toFixed(2)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${campaign.status === "ACTIVE" ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50' :
                                                        campaign.status === "FAILED" ? 'bg-red-900/30 text-red-400 border-red-900/50' :
                                                            'bg-sky-900/30 text-sky-400 border-sky-900/50'
                                                        }`}>
                                                        {campaign.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-400">
                                                    {new Date(campaign.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
