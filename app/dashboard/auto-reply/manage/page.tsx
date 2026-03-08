"use client"

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { MessageSquareShare, Trash2, Power, PowerOff, Settings, AlertCircle, Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ar, enUS } from 'date-fns/locale';

export default function ManageAutoReplies() {
    const { t, locale } = useLanguage();
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [sysConfig, setSysConfig] = useState({ autoReplyEnabled: true });

    const fetchRules = async () => {
        try {
            const [rulesRes, configRes] = await Promise.all([
                fetch('/api/auto-reply'),
                fetch('/api/auto-reply/config')
            ]);
            if (rulesRes.ok) {
                const data = await rulesRes.json();
                setRules(data);
            }
            if (configRes.ok) {
                const conf = await configRes.json();
                setSysConfig(conf);
            }
        } catch (error) {
            console.error("Failed to fetch rules", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const toggleRuleStatus = async (id: string, currentStatus: boolean) => {
        setActionLoading(id);
        try {
            const res = await fetch(`/api/auto-reply/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            if (res.ok) {
                setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !currentStatus } : r));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(null);
        }
    };

    const deleteRule = async (id: string) => {
        if (!confirm(t("confirmDeleteRule" as any))) return;

        setActionLoading(id);
        try {
            const res = await fetch(`/api/auto-reply/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setRules(prev => prev.filter(r => r.id !== id));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="p-12 text-center dark:text-slate-400 text-slate-500">{locale === 'ar' ? "جاري التحميل..." : "Loading..."}</div>;

    if (!sysConfig.autoReplyEnabled) {
        return (
            <div className="max-w-3xl mx-auto p-12 text-center bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-2xl">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4 opacity-80" />
                <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">{t("featureDisabled" as any)}</h2>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto transition-colors duration-300 min-h-[500px]" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                            <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900 tracking-tight">{t("manageAutoReply" as any)}</h2>
                    </div>
                    <p className="dark:text-slate-400 text-slate-500 text-sm md:text-base">{t("manageAutoReplyDesc" as any)}</p>
                </div>
                <Link
                    href="/dashboard/auto-reply"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 inline-flex items-center justify-center gap-2"
                >
                    <MessageSquareShare size={18} />
                    {t("setupAutoReply" as any)}
                </Link>
            </header>

            {rules.length === 0 ? (
                <div className="dark:bg-[#151921] bg-white rounded-2xl border dark:border-[#2A303C] border-slate-200 text-center py-16 px-6">
                    <MessageSquareShare className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t("noRulesFound" as any)}</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                        {locale === 'ar' ? "لم تقم بإعداد أي قواعد للرد التلقائي حتى الآن." : "You haven't set up any auto-reply rules yet."}
                    </p>
                    <Link
                        href="/dashboard/auto-reply"
                        className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#2A303C] dark:hover:bg-[#3A404C] text-slate-700 dark:text-white font-medium rounded-xl transition-all inline-flex items-center justify-center"
                    >
                        {t("setupAutoReply" as any)}
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rules.map(rule => (
                        <div key={rule.id} className="dark:bg-[#151921] bg-white rounded-2xl border dark:border-[#2A303C] border-slate-200 shadow-sm p-6 relative flex flex-col group transition-all hover:shadow-md hover:border-indigo-500/30">

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className={`text-xs font-semibold px-2 py-1 rounded inline-flex items-center gap-1 ${rule.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${rule.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                        {rule.isActive ? t("active" as any) : t("paused" as any)}
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                    <Calendar size={12} />
                                    {format(new Date(rule.createdAt), 'MMM d, yyyy', { locale: locale === 'ar' ? ar : enUS })}
                                </span>
                            </div>

                            <div className="space-y-3 flex-grow mb-6">
                                <div>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t("targetPage" as any)}</span>
                                    <div className="font-semibold text-sm text-slate-800 dark:text-slate-200" dir="ltr">{rule.pageId}</div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{t("targetPost" as any)}</span>
                                        <a href={`https://facebook.com/${rule.pageId}/posts/${rule.postId}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 transition-colors" title="View on Facebook">
                                            <ExternalLink size={14} />
                                        </a>
                                    </div>
                                    <div className="font-mono text-xs p-1.5 bg-slate-50 dark:bg-[#0B0E14] border border-slate-100 dark:border-[#2A303C] rounded break-all text-slate-600 dark:text-slate-300" dir="ltr">{rule.postId}</div>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t("replyMessage" as any)}</span>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                                        {rule.includeName ? (locale === 'ar' ? "[الاسم] " : "[Name] ") : ""}{rule.replyText}
                                    </p>
                                </div>
                                {rule.keywords && (
                                    <div>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t("triggerKeywords" as any)}</span>
                                        <div className="flex flex-wrap gap-1">
                                            {rule.keywords.split(',').map((kw: string, i: number) => (
                                                <span key={i} className="text-xs px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 rounded border border-indigo-100 dark:border-indigo-500/20">
                                                    {kw.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-[#2A303C] mt-auto">
                                <button
                                    onClick={() => toggleRuleStatus(rule.id, true)}
                                    disabled={actionLoading === rule.id || !rule.isActive}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors border ${rule.isActive
                                        ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 dark:hover:bg-amber-500/20 cursor-pointer'
                                        : 'bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-800/30 dark:border-slate-800 dark:text-slate-600 cursor-not-allowed'}`}
                                >
                                    <PowerOff size={16} /> {t("pauseRule" as any)}
                                </button>
                                <button
                                    onClick={() => toggleRuleStatus(rule.id, false)}
                                    disabled={actionLoading === rule.id || rule.isActive}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors border ${!rule.isActive
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20 cursor-pointer'
                                        : 'bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-800/30 dark:border-slate-800 dark:text-slate-600 cursor-not-allowed'}`}
                                >
                                    <Power size={16} /> {t("resumeRule" as any)}
                                </button>
                                <button
                                    onClick={() => deleteRule(rule.id)}
                                    disabled={actionLoading === rule.id}
                                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-colors"
                                    title={t("delete" as any)}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {/* Loading Overlay for the specific card */}
                            {actionLoading === rule.id && (
                                <div className="absolute inset-0 bg-white/50 dark:bg-[#151921]/50 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10">
                                    <svg className="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            )}

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
