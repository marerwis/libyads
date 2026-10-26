"use client"

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { MessageSquareShare, Trash2, Power, PowerOff, Settings, AlertCircle, Calendar, ExternalLink, TimerOff, Edit3, X, Save, MessageSquareText, Plus, Bot, Sparkles } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ar, enUS } from 'date-fns/locale';

export default function ManageAiAutoReplies() {
    const { t, locale } = useLanguage();
    const [rules, setRules] = useState<any[]>([]);
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [sysConfig, setSysConfig] = useState({ autoReplyEnabled: true });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rulesRes, pagesRes, configRes] = await Promise.all([
                fetch('/api/auto-reply'),
                fetch('/api/facebook/pages'),
                fetch('/api/auto-reply/config')
            ]);

            const rulesData = await rulesRes.json();
            const pagesData = await pagesRes.json();
            const configData = await configRes.json();

            if (Array.isArray(rulesData)) setRules(rulesData);
            if (Array.isArray(pagesData)) setPages(pagesData);
            if (configData) setSysConfig(configData);
        } catch (error) {
            console.error("Failed to load rules:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRuleStatus = async (id: string, currentStatus: boolean) => {
        setActionLoading(id);
        try {
            const res = await fetch(`/api/auto-reply/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            if (res.ok) {
                setRules(rules.map(r => r.id === id ? { ...r, isActive: !currentStatus } : r));
            }
        } catch (error) {
            console.error("Toggle error:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const deleteRule = async (id: string) => {
        if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذه القاعدة؟' : 'Are you sure you want to delete this rule?')) return;
        setActionLoading(id);
        try {
            const res = await fetch(`/api/auto-reply/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setRules(rules.filter(r => r.id !== id));
            }
        } catch (error) {
            console.error("Delete error:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const getPageName = (pageId: string) => {
        const page = pages.find(p => p.pageId === pageId || p.id === pageId);
        return page ? page.pageName : pageId;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Bot className="w-8 h-8 text-purple-600" />
                        {locale === 'ar' ? "إدارة الردود الذكية للمنشورات" : "Manage AI Post Auto-Replies"}
                    </h2>
                    <p className="dark:text-slate-400 text-slate-500 text-sm mt-1">
                        {locale === 'ar' ? "عرض وتعديل ومراقبة قواعد الرد الذكي المفعّلة على منشوراتك." : "Monitor and manage AI auto-reply rules for your posts."}
                    </p>
                </div>
                <Link
                    href="/dashboard/ai-auto-reply"
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
                >
                    <Plus size={18} />
                    {locale === 'ar' ? "إنشاء رد ذكي جديد" : "New AI Rule"}
                </Link>
            </header>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : rules.length === 0 ? (
                <div className="dark:bg-[#151921] bg-white rounded-2xl border dark:border-[#2A303C] border-slate-200 p-12 text-center">
                    <Bot size={48} className="mx-auto text-slate-400 mb-3" />
                    <h3 className="font-bold text-lg dark:text-white text-slate-900 mb-1">
                        {locale === 'ar' ? "لا توجد قواعد رد ذكي منشأة بعد" : "No rules found"}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        {locale === 'ar' ? "ابدأ بإنشاء أول رد ذكي مدعوم بالـ AI لمنشوراتك الآن." : "Start by creating your first AI auto-reply rule."}
                    </p>
                    <Link
                        href="/dashboard/ai-auto-reply"
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl inline-flex items-center gap-2"
                    >
                        <Plus size={18} />
                        {locale === 'ar' ? "إنشاء رد ذكي الآن" : "Create Now"}
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rules.map((rule) => {
                        const isAi = rule.replyText === "__AI_REPLY__";
                        return (
                            <div
                                key={rule.id}
                                className="dark:bg-[#151921] bg-white rounded-2xl border dark:border-[#2A303C] border-slate-200 p-5 shadow-sm space-y-4 relative overflow-hidden"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-base dark:text-white text-slate-900">
                                                {getPageName(rule.pageId)}
                                            </span>
                                            {isAi ? (
                                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-semibold flex items-center gap-1">
                                                    <Sparkles size={11} />
                                                    ذكاء اصطناعي (AI)
                                                </span>
                                            ) : (
                                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                                    عادي (ثابت)
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-mono text-slate-400">Post ID: {rule.postId}</p>
                                    </div>
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${rule.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                        {rule.isActive ? (locale === 'ar' ? "مفعل" : "Active") : (locale === 'ar' ? "متوقف" : "Paused")}
                                    </span>
                                </div>

                                {/* Content Preview */}
                                <div className="p-3 bg-slate-50 dark:bg-[#0B0E14] rounded-xl text-xs space-y-2 border dark:border-slate-800/80 border-slate-200/60">
                                    {isAi ? (
                                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium">
                                            <Bot size={15} />
                                            <span>وكيل الذكاء الاصطناعي (Nemotron 3 Ultra) يصيغ ردوداً متنوعة وموجّهة للخاص.</span>
                                        </div>
                                    ) : (
                                        <div>
                                            <span className="font-semibold text-slate-500">{locale === 'ar' ? "الرد:" : "Reply:"} </span>
                                            <span className="dark:text-slate-300 text-slate-700">{rule.replyText}</span>
                                        </div>
                                    )}

                                    {rule.privateMessage && (
                                        <div>
                                            <span className="font-semibold text-blue-500">{locale === 'ar' ? "الخاص (DM):" : "DM:"} </span>
                                            <span className="dark:text-slate-400 text-slate-600 line-clamp-1">{rule.privateMessage}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Footer & Actions */}
                                <div className="flex items-center justify-between pt-2 border-t dark:border-slate-800 border-slate-100">
                                    <span className="text-xs text-slate-400">
                                        {locale === 'ar' ? `ردود مرسلة: ${rule.repliesSentCount || 0}` : `Replies: ${rule.repliesSentCount || 0}`}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleRuleStatus(rule.id, rule.isActive)}
                                            disabled={actionLoading === rule.id}
                                            className={`p-2 rounded-lg text-xs font-medium transition-colors ${rule.isActive ? 'hover:bg-amber-500/10 text-amber-500' : 'hover:bg-emerald-500/10 text-emerald-500'}`}
                                            title={rule.isActive ? (locale === 'ar' ? "إيقاف مؤقت" : "Pause") : (locale === 'ar' ? "تشغيل" : "Activate")}
                                        >
                                            {rule.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                                        </button>
                                        <button
                                            onClick={() => deleteRule(rule.id)}
                                            disabled={actionLoading === rule.id}
                                            className="p-2 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                                            title={locale === 'ar' ? "حذف" : "Delete"}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
