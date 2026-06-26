"use client"

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { MessageSquareShare, Trash2, Power, PowerOff, Settings, AlertCircle, Calendar, ExternalLink, TimerOff, Edit3, X, Save, MessageSquareText, Plus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ar, enUS } from 'date-fns/locale';

export default function ManageAutoReplies() {
    const { t, locale } = useLanguage();
    const [rules, setRules] = useState<any[]>([]);
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [sysConfig, setSysConfig] = useState({ autoReplyEnabled: true });
    
    // Edit Modal State
    const [editingRule, setEditingRule] = useState<any>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    const fetchRules = async () => {
        try {
            const [rulesRes, configRes, pagesRes] = await Promise.all([
                fetch('/api/auto-reply'),
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

    const saveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch(`/api/auto-reply/${editingRule.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                const updatedRule = await res.json();
                setRules(prev => prev.map(r => r.id === updatedRule.id ? updatedRule : r));
                setEditingRule(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
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
                            <MessageSquareText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900 tracking-tight">
                            {locale === 'ar' ? 'إدارة الردود التلقائية' : 'Manage Auto-Replies'}
                        </h2>
                    </div>
                    <p className="dark:text-slate-400 text-slate-500 text-sm md:text-base">
                        {locale === 'ar' ? 'عرض وتعديل أو حذف الردود المبرمجة للمنشورات المختلفة.' : 'View, edit, or delete scheduled auto-replies for your posts.'}
                    </p>
                </div>
                <Link
                    href="/dashboard/auto-reply"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 inline-flex items-center justify-center gap-2"
                >
                    <Plus size={18} />
                    {locale === 'ar' ? 'إضافة رد جديد' : 'Add Auto-Reply'}
                </Link>
            </header>

            {pages.some(p => p.status === 'RESTRICTED') && (
                <div className="mb-8 p-4 rounded-xl text-sm font-medium dark:bg-red-900/20 bg-red-50 dark:text-red-300 text-red-700 border dark:border-red-900/50 border-red-200 flex gap-3 items-start animate-pulse">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <strong className="block mb-1">{locale === 'ar' ? 'تنبيه هام: حظر مؤقت من فيسبوك 🚨' : 'Important: Temporary Facebook Block 🚨'}</strong>
                        {locale === 'ar' 
                            ? 'لقد قام فيسبوك بتقييد التعليقات مؤقتاً لبعض صفحاتك بسبب إرسال عدد كبير من الردود المتطابقة مسبقاً. نرجو منك إيقاف قواعد الرد التلقائي لتلك الصفحات مؤقتاً والانتظار حتى يزول الحظر من فيسبوك (12-24 ساعة) ثم استخدام ميزة "تعديل" لتنويع الردود.'
                            : 'Facebook has temporarily restricted comments on some of your pages due to sending too many identical replies earlier. Please pause your auto-reply rules for those pages and wait for the block to clear (12-24 hours), then edit the rules to add random variants.'}
                    </div>
                </div>
            )}

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
                <div className="space-y-12">
                    {Object.entries(
                        rules.reduce((acc, rule) => {
                            const page = pages.find(p => p.id === rule.pageId || p.pageId === rule.pageId);
                            const pageName = page ? page.name : (locale === 'ar' ? 'صفحة غير معروفة' : 'Unknown Page');
                            if (!acc[pageName]) acc[pageName] = [];
                            acc[pageName].push(rule);
                            return acc;
                        }, {} as Record<string, typeof rules>)
                    ).map(([pageName, pageRules]) => {
                        const page = pages.find(p => p.name === pageName);
                        return (
                        <div key={pageName} className="space-y-6">
                            <h3 className="text-xl font-bold dark:text-white text-slate-800 flex items-center gap-3 border-b border-slate-200 dark:border-[#2A303C] pb-3">
                                <span className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                </span>
                                {pageName}
                                <span className="bg-slate-100 dark:bg-[#151921] text-slate-600 dark:text-slate-400 text-sm py-0.5 px-3 rounded-full border border-slate-200 dark:border-[#2A303C]">
                                    {(pageRules as any[]).length} {locale === 'ar' ? 'ردود' : 'Rules'}
                                </span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {(pageRules as any[]).map((rule: any) => {
                                    const expirationDate = new Date(rule.createdAt);
                                    expirationDate.setDate(expirationDate.getDate() + (rule.activeDays || 30));
                                    const isExpired = new Date() > expirationDate;

                                    return (
                                        <div key={rule.id} className={`dark:bg-[#151921] bg-white rounded-2xl border ${isExpired ? 'dark:border-red-500/50 border-red-300 shadow-md ring-1 ring-red-500/20' : 'dark:border-[#2A303C] border-slate-200'} shadow-sm p-6 relative flex flex-col group transition-all hover:shadow-md hover:border-indigo-500/30 overflow-hidden`}>
                                            
                                            {isExpired && (
                                                <div className="absolute top-0 inset-x-0 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 py-1.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider relative z-10 mb-4 border-b border-red-200 dark:border-red-500/30">
                                                    <TimerOff size={14} /> 
                                                    {locale === 'ar' ? 'انتهى الوقت (منتهي الصلاحية)' : 'Time Expired'}
                                                </div>
                                            )}

                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className={`text-xs font-semibold px-2 py-1 rounded inline-flex items-center gap-1 ${rule.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${rule.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                        {rule.isActive ? t("active" as any) : t("paused" as any)}
                                                    </div>
                                                    {page?.status === 'RESTRICTED' && (
                                                        <div className="text-xs font-semibold px-2 py-1 rounded inline-flex items-center gap-1 w-max bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 mt-1" title={locale === 'ar' ? 'فيسبوك علّق الردود مؤقتاً بسبب الإزعاج' : 'Facebook suspended replies temporarily'}>
                                                            <AlertCircle size={12} />
                                                            {locale === 'ar' ? 'حظر فيسبوك مؤقت' : 'Temp FB Blocked'}
                                                        </div>
                                                    )}
                                                </div>
                                            <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                                <Calendar size={12} />
                                                {format(new Date(rule.createdAt), 'MMM d, yyyy', { locale: locale === 'ar' ? ar : enUS })}
                                            </span>
                                        </div>

                                        <div className="space-y-3 flex-grow mb-6">
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
                                            {rule.privateMessage && (
                                                <div>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{locale === 'ar' ? 'الرسالة الخاصة' : 'Private Message'}</span>
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2 italic">
                                                        {rule.privateMessage}
                                                    </p>
                                                </div>
                                            )}
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
                                                onClick={() => {
                                                    setEditingRule(rule);
                                                    setEditForm(rule);
                                                }}
                                                disabled={actionLoading === rule.id}
                                                className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-transparent hover:border-blue-200 dark:hover:border-blue-500/20 transition-colors"
                                                title={locale === 'ar' ? 'تعديل' : 'Edit'}
                                            >
                                                <Edit3 size={18} />
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

                                        {/* Loading Overlay */}
                                        {actionLoading === rule.id && (
                                            <div className="absolute inset-0 bg-white/50 dark:bg-[#151921]/50 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-50">
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
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {editingRule && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto pt-20 pb-20">
                    <div className="bg-white dark:bg-[#151921] rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 dark:border-[#2A303C] overflow-hidden relative" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-[#2A303C]">
                            <h3 className="text-xl font-bold dark:text-white text-slate-900 flex items-center gap-2">
                                <Edit3 className="w-5 h-5 text-indigo-500" />
                                {locale === 'ar' ? 'تعديل قاعدة الرد التلقائي' : 'Edit Auto-Reply Rule'}
                            </h3>
                            <button onClick={() => setEditingRule(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={saveEdit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-2">{locale === 'ar' ? 'رسالة الرد 1 (إجبارية)' : 'Reply Message 1'} <span className="text-red-500">*</span></label>
                                    <textarea value={editForm.replyText || ''} onChange={e => setEditForm({...editForm, replyText: e.target.value})} rows={2} required className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl px-4 py-2 dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 transition-colors resize-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-2">{locale === 'ar' ? 'رسالة الرد 2 (اختيارية)' : 'Reply Message 2'}</label>
                                    <textarea value={editForm.replyText2 || ''} onChange={e => setEditForm({...editForm, replyText2: e.target.value})} rows={2} className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl px-4 py-2 dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 transition-colors resize-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-2">{locale === 'ar' ? 'رسالة الرد 3 (اختيارية)' : 'Reply Message 3'}</label>
                                    <textarea value={editForm.replyText3 || ''} onChange={e => setEditForm({...editForm, replyText3: e.target.value})} rows={2} className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl px-4 py-2 dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 transition-colors resize-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-2">{locale === 'ar' ? 'الرسالة الخاصة (اختياري)' : 'Private Message'}</label>
                                    <textarea value={editForm.privateMessage || ''} onChange={e => setEditForm({...editForm, privateMessage: e.target.value})} rows={2} className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl px-4 py-2 dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 transition-colors resize-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-2">{t('triggerKeywords' as any)}</label>
                                        <input type="text" value={editForm.keywords || ''} onChange={e => setEditForm({...editForm, keywords: e.target.value})} className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl px-4 py-2 dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-2">{locale === 'ar' ? 'أيام التفعيل' : 'Active Days'}</label>
                                        <input type="number" min="1" value={editForm.activeDays || 30} onChange={e => setEditForm({...editForm, activeDays: parseInt(e.target.value) || 30})} className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl px-4 py-2 dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 transition-colors" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                    <input type="checkbox" id="includeNameEdit" checked={editForm.includeName} onChange={e => setEditForm({...editForm, includeName: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded" />
                                    <label htmlFor="includeNameEdit" className="text-sm font-semibold dark:text-slate-300 text-slate-700">{t('includeName' as any)}</label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-[#2A303C]">
                                <button type="button" onClick={() => setEditingRule(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#2A303C] dark:hover:bg-[#3A404C] text-slate-700 dark:text-white font-medium rounded-xl transition-all">
                                    {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button type="submit" disabled={isSaving} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2">
                                    {isSaving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : <Save size={18} />}
                                    {locale === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
