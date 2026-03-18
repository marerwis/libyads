"use client"

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { MessageSquareShare, Trash2, Power, PowerOff, Settings, AlertCircle, Calendar, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ar, enUS } from 'date-fns/locale';

export default function ManagePageAutoReplies() {
    const { t, locale } = useLanguage();
    const [rules, setRules] = useState<any[]>([]);
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [sysConfig, setSysConfig] = useState({ autoReplyEnabled: true });

    const fetchRules = async () => {
        try {
            const [rulesRes, configRes, pagesRes] = await Promise.all([
                fetch('/api/page-auto-reply'),
                fetch('/api/auto-reply/config'),
                fetch('/api/facebook/pages')
            ]);
            if (rulesRes.ok) {
                const data = await rulesRes.json();
                setRules(data);
            }
            if (configRes.ok) {
                const conf = await configRes.json();
                setSysConfig(conf);
            }
            if (pagesRes.ok) {
                const pagesData = await pagesRes.json();
                if (Array.isArray(pagesData)) {
                    setPages(pagesData);
                }
            }
        } catch (error) {
            console.error("Failed to fetch page-level rules", error);
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
            const res = await fetch(`/api/page-auto-reply/${id}`, {
                method: "PUT",
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
        if (!confirm(locale === 'ar' ? "هل أنت متأكد من حذف هذه القاعدة؟" : "Are you sure you want to delete this rule?")) return;

        setActionLoading(id);
        try {
            console.log("Attempting to delete rule:", id);
            const res = await fetch(`/api/page-auto-reply/${id}`, {
                method: "DELETE"
            });
            
            console.log("Delete response status:", res.status, res.statusText);
            
            if (res.ok) {
                setRules(prev => prev.filter(r => r.id !== id));
                console.log("Rule deleted successfully from UI state.");
            } else {
                const text = await res.text();
                console.error("Failed to delete rule. Raw response:", text);
                try {
                    const data = JSON.parse(text);
                    alert(data.error || "Failed to delete rule");
                } catch(e) {
                    alert(`Failed to delete rule (Status: ${res.status})`);
                }
            }
        } catch (error) {
            console.error("Error deleting rule:", error);
            alert("An error occurred while deleting the rule.");
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
        <div className="max-w-6xl mx-auto transition-colors duration-300 min-h-[500px]" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                            <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900 tracking-tight">
                            {locale === 'ar' ? 'إدارة الردود التلقائية للصفحات' : 'Manage Page Auto-Replies'}
                        </h2>
                    </div>
                    <p className="dark:text-slate-400 text-slate-500 text-sm md:text-base">
                        {locale === 'ar' ? 'عرض وإدارة اعدادات الرد التلقائي الشاملة لصفحاتك.' : 'View and manage global auto-reply settings for your pages.'}
                    </p>
                </div>
                <Link
                    href="/dashboard/page-auto-reply"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 inline-flex items-center justify-center gap-2"
                >
                    <MessageSquareShare size={18} />
                    {locale === 'ar' ? 'إضافة رد صفحة' : 'Add Page Reply'}
                </Link>
            </header>

            {rules.length === 0 ? (
                <div className="dark:bg-[#151921] bg-white rounded-2xl border dark:border-[#2A303C] border-slate-200 text-center py-16 px-6">
                    <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {locale === 'ar' ? 'لا توجد قواعد لصفحات' : 'No Page Rules Found'}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                        {locale === 'ar' ? "لم تقم بإعداد أي قواعد للرد التلقائي الشامل لأي صفحة حتى الآن." : "You haven't set up any global auto-reply rules for any page yet."}
                    </p>
                    <Link
                        href="/dashboard/page-auto-reply"
                        className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#2A303C] dark:hover:bg-[#3A404C] text-slate-700 dark:text-white font-medium rounded-xl transition-all inline-flex items-center justify-center"
                    >
                        {locale === 'ar' ? 'إضافة رد صفحة' : 'Add Page Reply'}
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {rules.map((rule: any) => {
                        const page = pages.find(p => p.id === rule.pageId || p.pageId === rule.pageId);
                        const pageName = page ? page.name : (locale === 'ar' ? 'صفحة غير معروفة' : 'Unknown Page');

                        return (
                            <div key={rule.id} className="dark:bg-[#151921] bg-white rounded-2xl border dark:border-[#2A303C] border-slate-200 shadow-sm p-6 relative flex flex-col group transition-all hover:shadow-md hover:border-indigo-500/30">

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex flex-col gap-2">
                                        <h3 className="font-bold text-lg dark:text-white text-slate-800 flex items-center gap-2">
                                            {pageName}
                                        </h3>
                                        <div className={`text-xs font-semibold px-2 py-1 rounded inline-flex items-center gap-1 w-max ${rule.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${rule.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                            {rule.isActive ? t("active" as any) : t("paused" as any)}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                         <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                            <Calendar size={12} />
                                            {format(new Date(rule.createdAt), 'MMM d, yyyy', { locale: locale === 'ar' ? ar : enUS })}
                                        </span>
                                        <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 px-2 py-1 rounded text-xs font-medium">
                                            {locale === 'ar' ? `${rule.activeDays} أيام تفعيل` : `${rule.activeDays} Active Days`}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4 flex-grow mb-6">
                                    <div>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 block mb-2">{locale === 'ar' ? 'نماذج الرد (عشوائي)' : 'Reply Templates (Randomized)'}</span>
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {rule.replyTexts?.map((text: string, idx: number) => (
                                                <div key={idx} className="p-3 bg-slate-50 dark:bg-[#0B0E14] border border-slate-100 dark:border-[#2A303C] rounded-lg text-sm text-slate-700 dark:text-slate-300">
                                                    <span className="text-xs font-bold text-indigo-500 mr-2">{idx + 1}.</span>
                                                    {rule.includeName ? (locale === 'ar' ? "[الاسم] " : "[Name] ") : ""}{text}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {rule.privateMessage && (
                                        <div>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{locale === 'ar' ? 'الرسالة الخاصة' : 'Private Message'}</span>
                                            <p className="text-sm p-3 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg text-emerald-800 dark:text-emerald-200 leading-relaxed italic">
                                                {rule.privateMessage}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-[#2A303C] mt-auto">
                                    <button
                                        onClick={() => toggleRuleStatus(rule.id, true)}
                                        disabled={actionLoading === rule.id || !rule.isActive}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors border ${rule.isActive
                                            ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 dark:hover:bg-amber-500/20 cursor-pointer'
                                            : 'bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-800/30 dark:border-slate-800 dark:text-slate-600 cursor-not-allowed'}`}
                                    >
                                        <PowerOff size={16} /> {t("pauseRule" as any)}
                                    </button>
                                    <button
                                        onClick={() => toggleRuleStatus(rule.id, false)}
                                        disabled={actionLoading === rule.id || rule.isActive}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors border ${!rule.isActive
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20 cursor-pointer'
                                            : 'bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-800/30 dark:border-slate-800 dark:text-slate-600 cursor-not-allowed'}`}
                                    >
                                        <Power size={16} /> {t("resumeRule" as any)}
                                    </button>
                                    <button
                                        onClick={() => deleteRule(rule.id)}
                                        disabled={actionLoading === rule.id}
                                        className="p-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-colors"
                                        title={locale === 'ar' ? 'حذف' : 'Delete'}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>

                                {/* Loading Overlay */}
                                {actionLoading === rule.id && (
                                    <div className="absolute inset-0 bg-white/50 dark:bg-[#151921]/50 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10">
                                        <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                )}

                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
