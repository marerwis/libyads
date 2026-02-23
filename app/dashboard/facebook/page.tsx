"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FacebookPagesContent() {
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [message, setMessage] = useState<{ type: "error" | "success", text: string } | null>(null);

    const searchParams = useSearchParams();

    useEffect(() => {
        // Handle URL parameters from the OAuth callback
        const error = searchParams.get('error');
        const success = searchParams.get('success');

        if (error) {
            setMessage({ type: "error", text: `Facebook Connection Failed: ${error}` });
        } else if (success) {
            setMessage({ type: "success", text: "Successfully connected Facebook Pages!" });
        }

        // Clean up URL to avoid showing errors/successes on refresh
        if (error || success) {
            window.history.replaceState(null, '', window.location.pathname);
        }

        fetchPages();
    }, [searchParams]);

    const fetchPages = async () => {
        try {
            const res = await fetch('/api/facebook/pages');
            const data = await res.json();
            if (Array.isArray(data)) {
                setPages(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const handleConnectFacebook = async () => {
        setConnecting(true);
        setMessage(null);
        try {
            const res = await fetch("/api/facebook/auth");
            const data = await res.json();

            if (res.ok && data.url) {
                // Redirect user to Facebook OAuth Dialog
                window.location.href = data.url;
            } else {
                setMessage({ type: "error", text: data.error || "Failed to initiate Facebook login" });
                setConnecting(false);
            }
        } catch (error) {
            setMessage({ type: "error", text: "Internal Server Error" });
            setConnecting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-semibold text-white">Facebook Pages</h2>
                    <p className="text-slate-400 text-sm mt-1">Manage connected Facebook Pages to run destination ad campaigns.</p>
                </div>
            </header>

            {message && (
                <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Connect Facebook Card */}
                <div className="lg:col-span-1">
                    <div className="bg-[#151921] rounded-xl border border-[#2A303C] p-6 shadow-sm flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-blue-900/20 flex items-center justify-center text-[#1877F2] mb-4">
                            <span className="material-symbols-outlined text-4xl">facebook</span>
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">Connect Pages</h3>
                        <p className="text-sm text-slate-400 mb-6">
                            Securely link your Facebook account to manage pages and run ad campaigns automatically.
                        </p>
                        <button
                            onClick={handleConnectFacebook}
                            disabled={connecting}
                            className="w-full px-4 py-3 bg-[#1877F2] hover:bg-blue-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                            {connecting ? (
                                "Redirecting..."
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm">login</span>
                                    Connect Facebook
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Pages List */}
                <div className="lg:col-span-2">
                    <div className="bg-[#151921] rounded-xl border border-[#2A303C] overflow-hidden shadow-sm h-full">
                        <div className="p-6 border-b border-[#2A303C]">
                            <h3 className="text-lg font-medium text-white">Connected Pages</h3>
                        </div>
                        {loading ? (
                            <div className="p-8 text-center text-slate-400">Loading your pages...</div>
                        ) : pages.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2] mb-4">
                                    <span className="material-symbols-outlined text-3xl">flag</span>
                                </div>
                                <h3 className="text-white font-medium mb-1">No pages connected</h3>
                                <p className="text-slate-400 text-sm max-w-sm">Use the "Connect Facebook" button to authenticate and load your pages automatically.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-[#2A303C]">
                                {pages.map(page => (
                                    <li key={page.id} className="p-6 flex items-center justify-between hover:bg-[#0B0E14]/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-blue-900/20 flex items-center justify-center text-[#1877F2]">
                                                <span className="material-symbols-outlined">flag</span>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-medium">{page.pageName}</h4>
                                                <p className="text-slate-400 text-xs mt-0.5">ID: {page.pageId}</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 rounded-full bg-emerald-900/30 text-emerald-400 text-xs font-medium border border-emerald-900/50">
                                            Connected
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function FacebookPages() {
    return (
        <Suspense fallback={<div className="text-slate-400">Loading Configuration...</div>}>
            <FacebookPagesContent />
        </Suspense>
    );
}
