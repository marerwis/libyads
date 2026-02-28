"use client"

import { useState, useEffect } from "react";
import { Megaphone, Play, Pause, Eye, Search } from "lucide-react";

export default function CampaignsHistoryPage() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: "error" | "success", text: string } | null>(null);

    const fetchCampaigns = async () => {
        try {
            const res = await fetch('/api/campaign/list');
            const data = await res.json();
            if (Array.isArray(data)) setCampaigns(data);
        } catch (error) {
            console.error("Failed to fetch campaigns", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const toggleCampaignStatus = async (id: string, currentStatus: string) => {
        if (!id) return;
        const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";

        try {
            // Update UI optimistically
            setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));

            const res = await fetch(`/api/campaign/${id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                // Revert on failure
                const errorData = await res.json();
                setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: currentStatus } : c));
                setMessage({ type: "error", text: errorData.error || "Failed to update campaign status." });
            }
        } catch (error) {
            setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: currentStatus } : c));
            setMessage({ type: "error", text: "Network error while updating status." });
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-semibold text-white">Campaign History</h2>
                    <p className="text-slate-400 text-sm mt-1">Manage, pause, and review your active promotions.</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-slate-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search campaigns..."
                            className="bg-[#151921] border border-[#2A303C] text-sm text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 transition-colors w-64"
                        />
                    </div>
                </div>
            </header>

            {message && (
                <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-[#151921] rounded-xl border border-[#2A303C] overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">Loading campaigns data...</div>
                ) : campaigns.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6 shadow-inner">
                            <Megaphone size={36} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">No campaigns yet</h3>
                        <p className="text-slate-400 text-sm max-w-sm mb-6">You haven't launched any promotions yet. Navigate to "Create Promotion" to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="text-xs text-slate-400 uppercase bg-[#0B0E14]/50 border-b border-[#2A303C]">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Campaign Meta ID</th>
                                    <th className="px-6 py-4 font-medium">Page & Post</th>
                                    <th className="px-6 py-4 font-medium">Budget</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Date Created</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2A303C]">
                                {campaigns.map(campaign => (
                                    <tr key={campaign.id} className="hover:bg-[#0B0E14]/30 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-xs opacity-80">{campaign.campaignId || 'Pending'}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-200">Post ID: {campaign.postId}</div>
                                            <div className="text-xs text-slate-500 mt-1">Page ID: {campaign.pageId}</div>
                                        </td>
                                        <td className="px-6 py-4 leading-relaxed">
                                            <div className="font-medium text-slate-200">${campaign.budget.toFixed(2)} total</div>
                                            <div className="text-xs text-slate-500 mt-1">{campaign.duration} Days</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${campaign.status === "ACTIVE" ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                    campaign.status === "FAILED" ? 'bg-red-500' :
                                                        'bg-slate-500'
                                                    }`} />
                                                <span className={`font-medium ${campaign.status === "ACTIVE" ? 'text-emerald-400' :
                                                    campaign.status === "FAILED" ? 'text-red-400' :
                                                        'text-slate-400'
                                                    }`}>
                                                    {campaign.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            {new Date(campaign.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 text-slate-500">
                                                <button
                                                    onClick={() => toggleCampaignStatus(campaign.id, campaign.status)}
                                                    disabled={campaign.status === "FAILED" || !campaign.campaignId}
                                                    className="p-2 bg-slate-800/50 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-transparent hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed group-hover:opacity-100"
                                                    title={campaign.status === "ACTIVE" ? "Pause Campaign" : "Resume Campaign"}
                                                >
                                                    {campaign.status === "ACTIVE" ? <Pause size={16} /> : <Play size={16} />}
                                                </button>
                                                <a
                                                    href={`https://facebook.com/${campaign.pageId}/posts/${campaign.postId?.includes('_') ? campaign.postId.split('_')[1] : campaign.postId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="View Promoted Post"
                                                    className="p-2 bg-slate-800/50 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-transparent hover:border-slate-600 group-hover:opacity-100 flex items-center justify-center">
                                                    <Eye size={16} />
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
