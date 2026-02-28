"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Facebook, LogIn, Flag } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

function FacebookPagesContent() {
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [message, setMessage] = useState<{ type: "error" | "success", text: string } | null>(null);

    const searchParams = useSearchParams();
    const { t } = useLanguage();

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
                    <h2 className="text-2xl font-semibold dark:text-white text-slate-900">{t("facebookPages")}</h2>
                    <p className="dark:text-slate-400 text-slate-500 text-sm mt-1">{t("manageAndTrack")}</p>
                </div>
            </header>

            {message && (
                <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'error' ? 'dark:bg-red-900/30 bg-red-50 dark:text-red-400 text-red-600 border dark:border-red-900/50 border-red-200' : 'dark:bg-emerald-900/30 bg-emerald-50 dark:text-emerald-400 text-emerald-600 border dark:border-emerald-900/50 border-emerald-200'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Connect Facebook Card */}
                <div className="lg:col-span-1">
                    <div className="dark:bg-[#151921] bg-white rounded-xl border dark:border-[#2A303C] border-slate-200 p-6 shadow-sm flex flex-col items-center text-center transition-colors">
                        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4 shadow-inner">
                            <Facebook size={36} strokeWidth={2} />
                        </div>
                        <h3 className="text-lg font-medium dark:text-white text-slate-900 mb-2">Connect Pages</h3>
                        <p className="text-sm dark:text-slate-400 text-slate-600 mb-6">
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
                                    <LogIn size={18} />
                                    Connect Facebook
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Pages List */}
                <div className="lg:col-span-2">
                    <div className="dark:bg-[#151921] bg-white rounded-xl border dark:border-[#2A303C] border-slate-200 overflow-hidden shadow-sm h-full transition-colors">
                        <div className="p-6 border-b dark:border-[#2A303C] border-slate-200">
                            <h3 className="text-lg font-medium dark:text-white text-slate-900">{t("facebookPages")}</h3>
                        </div>
                        {loading ? (
                            <div className="p-8 text-center dark:text-slate-400 text-slate-500">{t("fetchingPages")}</div>
                        ) : pages.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4 shadow-inner">
                                    <Flag size={32} strokeWidth={2} />
                                </div>
                                <h3 className="dark:text-white text-slate-900 font-medium mb-1">{t("noPagesLinked")}</h3>
                                <p className="dark:text-slate-400 text-slate-500 text-sm max-w-sm">Use the "Connect Facebook" button to authenticate and load your pages automatically.</p>
                            </div>
                        ) : (
                            <ul className="divide-y dark:divide-[#2A303C] divide-slate-200">
                                {pages.map(page => (
                                    <li key={page.id} className="p-6 flex items-center justify-between dark:hover:bg-[#0B0E14]/50 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
                                                <Flag size={20} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h4 className="dark:text-white text-slate-900 font-medium">{page.pageName}</h4>
                                                <p className="dark:text-slate-400 text-slate-500 text-xs mt-0.5">ID: {page.pageId}</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 rounded-full dark:bg-emerald-900/30 bg-emerald-50 dark:text-emerald-400 text-emerald-600 text-xs font-medium border dark:border-emerald-900/50 border-emerald-200">
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
