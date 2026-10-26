"use client"

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { MessageSquareShare, Trash2, Power, PowerOff, Settings, AlertCircle, Calendar, ExternalLink, TimerOff, Edit3, X, Save, MessageSquareText, Plus, Bot, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ar, enUS } from 'date-fns/locale';

export default function ManageAiPageAutoReplies() {
    const { t, locale } = useLanguage();
    const [rules, setRules] = useState<any[]>([]);
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // Edit Modal State
    const [editingRule, setEditingRule] = useState<any>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rulesRes, pagesRes] = await Promise.all([
                fetch('/api/page-auto-reply'),
                fetch('/api/facebook/pages')
            ]);

            const rulesData = await rulesRes.json();
            const pagesData = await pagesRes.json();

            if (Array.isArray(rulesData)) setRules(rulesData);
            if (Array.isArray(pagesData)) setPages(pagesData);
        } catch (error) {
            console.error("Failed to load page rules:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRuleStatus = async (id: string, currentStatus: boolean) => {
        setActionLoading(id);
        const newStatus = !currentStatus;
        try {
            const res = await fetch(`/api/page-auto-reply/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: newStatus })
            });
            if (res.ok) {
                setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: newStatus } : r));
            } else {
                alert(locale === 'ar' ? 'فشل تغيير حالة القاعدة' : 'Failed to toggle status');
            }
        } catch (error) {
            console.error("Toggle error:", error);
            alert(locale === 'ar' ? 'حدث خطأ في الاتصال' : 'Connection error');
        } finally {
            setActionLoading(null);
        }
    };

    const deleteRule = async (id: string) => {
        setActionLoading(id);
        setConfirmDeleteId(null);
        try {
            const res = await fetch(`/api/page-auto-reply/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setRules(prev => prev.filter(r => r.id !== id));
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.error || (locale === 'ar' ? "فشل الحذف" : "Failed to delete"));
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert(locale === 'ar' ? 'حدث خطأ أثناء الحذف' : 'An error occurred while deleting');
        } finally {
            setActionLoading(null);
        }
    };

    const saveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRule) return;
        setIsSaving(true);
        try {
            const payload: any = {
                privateMessage: editForm.privateMessage || "",
                includeName: Boolean(editForm.includeName)
            };

            const isAi = editingRule.replyTexts && editingRule.replyTexts.includes("__AI_REPLY__");
            if (!isAi && Array.isArray(editForm.replyTexts)) {
                payload.replyTexts = editForm.replyTexts.filter((t: string) => t && t.trim().length > 0);
            }

            const res = await fetch(`/api/page-auto-reply/${editingRule.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const updatedRule = await res.json();
                setRules(prev => prev.map(r => r.id === updatedRule.id ? updatedRule : r));
                setEditingRule(null);
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.error || (locale === 'ar' ? "فشل التحديث" : "Failed to update"));
            }
        } catch (error) {
            console.error("Edit error:", error);
            alert(locale === 'ar' ? 'حدث خطأ أثناء حفظ التعديل' : 'Failed to save edits');
        } finally {
            setIsSaving(false);
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
                        {locale === 'ar' ? "إدارة الردود الشاملة الذكية" : "Manage AI Page Auto-Replies"}
                    </h2>
                    <p className="dark:text-slate-400 text-slate-500 text-sm mt-1">
                        {locale === 'ar' ? "عرض وتعديل ومراقبة قواعد الرد الذكي المطبقة على صفحاتك بالكامل." : "Monitor and manage AI page-level auto-reply rules."}
                    </p>
                </div>
                <Link
                    href="/dashboard/ai-page-auto-reply"
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
                >
                    <Plus size={18} />
                    {locale === 'ar' ? "تفعيل رد شامل ذكي جديد" : "New Page AI Rule"}
                </Link>
            </header>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : rules.length === 0 ? (
                <div className="text-center py-16 dark:bg-[#151921] bg-white rounded-2xl border dark:border-[#2A303C] border-slate-200 p-8">
                    <Bot className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-2">
                        {locale === 'ar' ? "لا توجد قواعد رد شامل حالياً" : "No Page Rules Yet"}
                    </h3>
                    <p className="dark:text-slate-400 text-slate-500 text-sm mb-6 max-w-md mx-auto">
                        {locale === 'ar' ? "ابدأ الآن بتفعيل الرد الشامل الذكي بالذكاء الاصطناعي ليرد على كل منشورات صفحتك أوتوماتيكياً." : "Create an AI page-level auto-reply rule to respond across all posts automatically."}
                    </p>
                    <Link
                        href="/dashboard/ai-page-auto-reply"
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl shadow-lg shadow-purple-500/20 transition-all inline-flex items-center gap-2"
                    >
                        <Plus size={18} />
                        {locale === 'ar' ? "إنشاء رد شامل ذكي" : "Create Now"}
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rules.map((rule) => {
                        const isAi = rule.replyTexts && rule.replyTexts.includes("__AI_REPLY__");
                        const pageName = getPageName(rule.pageId);

                        return (
                            <div
                                key={rule.id}
                                className="dark:bg-[#151921] bg-white rounded-2xl border dark:border-[#2A303C] border-slate-200 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/40 transition-all"
                            >
                                <div className="space-y-4">
                                    {/* Top Status & Date Bar */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${rule.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${rule.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                                {rule.isActive ? (locale === 'ar' ? "مفعل (نشط)" : "Active") : (locale === 'ar' ? "متوقف" : "Paused")}
                                            </span>

                                            {rule.activeDays !== undefined && (
                                                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {rule.activeDays} {locale === 'ar' ? 'أيام تفعيل' : 'days'}
                                                </span>
                                            )}
                                        </div>

                                        <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                            <Calendar size={12} />
                                            {format(new Date(rule.createdAt), 'MMM d, yyyy', { locale: locale === 'ar' ? ar : enUS })}
                                        </span>
                                    </div>

                                    {/* Page Info & Badge */}
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h4 className="font-bold text-lg dark:text-white text-slate-900">
                                                {pageName}
                                            </h4>
                                            {isAi ? (
                                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-bold flex items-center gap-1">
                                                    <Sparkles size={11} />
                                                    ذكاء اصطناعي شامل (AI)
                                                </span>
                                            ) : (
                                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                                    شامل عادي
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-mono text-slate-400">Page ID: {rule.pageId}</p>
                                    </div>

                                    {/* Content Preview */}
                                    <div className="p-3.5 bg-slate-50 dark:bg-[#0B0E14] rounded-xl text-xs space-y-2.5 border dark:border-slate-800/80 border-slate-200/60">
                                        {isAi ? (
                                            <div className="flex items-start gap-2 text-purple-600 dark:text-purple-400 font-medium">
                                                <Bot size={16} className="mt-0.5 flex-shrink-0" />
                                                <span className="leading-relaxed">الـ AI يرد على كل منشورات الصفحة بعبارات راقية ومختصرة توجّه العملاء للخاص.</span>
                                            </div>
                                        ) : (
                                            <div>
                                                <span className="font-semibold text-slate-500 block mb-1">{locale === 'ar' ? "نماذج الردود:" : "Replies:"}</span>
                                                <p className="dark:text-slate-300 text-slate-700 leading-relaxed font-sans">{rule.replyTexts?.join(" | ")}</p>
                                            </div>
                                        )}

                                        {rule.privateMessage && (
                                            <div className="pt-1.5 border-t dark:border-slate-800 border-slate-200/50">
                                                <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">{locale === 'ar' ? "الرسالة الخاصة (DM):" : "Private Message:"}</span>
                                                <p className="dark:text-slate-300 text-slate-700 leading-relaxed italic bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded-lg border border-emerald-500/20">{rule.privateMessage}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-xs text-slate-400 flex items-center justify-between">
                                        <span>{locale === 'ar' ? `ردود مرسلة: ${rule.repliesSentCount || 0}` : `Replies sent: ${rule.repliesSentCount || 0}`}</span>
                                        {rule.includeName && (
                                            <span className="text-slate-400 flex items-center gap-1">
                                                <CheckCircle2 size={12} className="text-emerald-500" />
                                                {locale === 'ar' ? 'تضمين الاسم مفعل' : 'Include Name'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons Footer */}
                                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-[#2A303C] mt-4 relative z-20">
                                    {/* Pause Button */}
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); toggleRuleStatus(rule.id, true); }}
                                        disabled={actionLoading === rule.id || !rule.isActive}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors border ${rule.isActive
                                            ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 dark:hover:bg-amber-500/20 cursor-pointer shadow-sm'
                                            : 'bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-800/30 dark:border-slate-800 dark:text-slate-600 cursor-not-allowed'}`}
                                        title={locale === 'ar' ? 'إيقاف مؤقت' : 'Pause'}
                                    >
                                        <PowerOff size={16} className="pointer-events-none" /> 
                                        <span>{locale === 'ar' ? 'إيقاف' : 'Pause'}</span>
                                    </button>

                                    {/* Resume / Activate Button */}
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); toggleRuleStatus(rule.id, false); }}
                                        disabled={actionLoading === rule.id || rule.isActive}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors border ${!rule.isActive
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20 cursor-pointer shadow-sm'
                                            : 'bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-800/30 dark:border-slate-800 dark:text-slate-600 cursor-not-allowed'}`}
                                        title={locale === 'ar' ? 'تشغيل' : 'Resume'}
                                    >
                                        <Power size={16} className="pointer-events-none" /> 
                                        <span>{locale === 'ar' ? 'تشغيل' : 'Resume'}</span>
                                    </button>

                                    {/* Edit Button */}
                                    <button
                                        type="button"
                                        onClick={(e) => { 
                                            e.preventDefault(); 
                                            setEditingRule(rule);
                                            setEditForm({
                                                ...rule,
                                                replyTexts: [...(rule.replyTexts || [])],
                                                privateMessage: rule.privateMessage || '',
                                                includeName: rule.includeName !== undefined ? rule.includeName : true
                                            });
                                        }}
                                        disabled={actionLoading === rule.id}
                                        className="p-2.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-500/20 transition-colors cursor-pointer min-w-[42px] flex items-center justify-center"
                                        title={locale === 'ar' ? 'تعديل' : 'Edit'}
                                    >
                                        <Edit3 size={18} className="pointer-events-none" />
                                    </button>

                                    {/* Delete Button with 2-step confirmation */}
                                    <button
                                        type="button"
                                        onClick={(e) => { 
                                            e.preventDefault(); 
                                            if (confirmDeleteId === rule.id) {
                                                deleteRule(rule.id);
                                            } else {
                                                setConfirmDeleteId(rule.id);
                                                setTimeout(() => setConfirmDeleteId(null), 3000);
                                            }
                                        }}
                                        disabled={actionLoading === rule.id}
                                        className="p-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-500/20 transition-colors cursor-pointer min-w-[42px] flex items-center justify-center"
                                        title={locale === 'ar' ? 'حذف' : 'Delete'}
                                    >
                                        {confirmDeleteId === rule.id ? (
                                            <span className="text-xs font-bold text-red-600 dark:text-red-400 animate-pulse px-1">
                                                {locale === 'ar' ? 'تأكيد؟' : 'Sure?'}
                                            </span>
                                        ) : (
                                            <Trash2 size={18} className="pointer-events-none" />
                                        )}
                                    </button>
                                </div>

                                {/* Loading Overlay */}
                                {actionLoading === rule.id && (
                                    <div className="absolute inset-0 bg-white/50 dark:bg-[#151921]/50 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-50">
                                        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Edit Modal */}
            {editingRule && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto pt-20 pb-20">
                    <div className="bg-white dark:bg-[#151921] rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 dark:border-[#2A303C] overflow-hidden relative" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-[#2A303C]">
                            <h3 className="text-xl font-bold dark:text-white text-slate-900 flex items-center gap-2">
                                <Bot className="w-6 h-6 text-purple-600" />
                                {locale === 'ar' ? `تعديل رد: ${getPageName(editingRule.pageId)}` : `Edit Rule: ${getPageName(editingRule.pageId)}`}
                            </h3>
                            <button onClick={() => setEditingRule(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={saveEdit} className="p-6 space-y-5">
                            {editingRule.replyTexts && editingRule.replyTexts.includes("__AI_REPLY__") ? (
                                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-300 text-xs flex items-start gap-3">
                                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                                    <p className="leading-relaxed">
                                        {locale === 'ar' 
                                            ? "وكيل الذكاء الاصطناعي (Nemotron 3 Ultra) يتولى صياغة وتوليد الردود على كل تعليق تلقائياً وبألفاظ راقية وموجّهة للخاص. التعديل متاح هنا للرسالة الخاصة الموجهة للعملاء عبر الماسنجر."
                                            : "AI agent generates polite and varied public comment replies automatically. You can edit the private direct message (DM) sent to customers here."}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-2">
                                        {locale === 'ar' ? 'نماذج الردود التلقائية' : 'Reply Messages'}
                                    </label>
                                    <div className="space-y-2">
                                        {(editForm.replyTexts || []).map((text: string, index: number) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={text}
                                                    onChange={(e) => {
                                                        const newTexts = [...editForm.replyTexts];
                                                        newTexts[index] = e.target.value;
                                                        setEditForm({ ...editForm, replyTexts: newTexts });
                                                    }}
                                                    className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl px-4 py-2 dark:text-white text-slate-900 focus:outline-none focus:border-purple-500"
                                                />
                                                {editForm.replyTexts.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newTexts = editForm.replyTexts.filter((_: any, i: number) => i !== index);
                                                            setEditForm({ ...editForm, replyTexts: newTexts });
                                                        }}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-2">
                                    {locale === 'ar' ? 'الرسالة الخاصة للعميل (الماسنجر / DM)' : 'Private Message (DM)'}
                                </label>
                                <textarea
                                    value={editForm.privateMessage || ''}
                                    onChange={e => setEditForm({ ...editForm, privateMessage: e.target.value })}
                                    rows={4}
                                    placeholder={locale === 'ar' ? 'اكتب تفاصيل الأسعار أو رسالة الترحيب أو روابط التواصل...' : 'Write details, prices, or contact info...'}
                                    className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl px-4 py-2.5 dark:text-white text-slate-900 focus:outline-none focus:border-purple-500 resize-none text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="includeNameEditAiPage"
                                    checked={editForm.includeName}
                                    onChange={e => setEditForm({ ...editForm, includeName: e.target.checked })}
                                    className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                                />
                                <label htmlFor="includeNameEditAiPage" className="text-sm font-medium dark:text-slate-300 text-slate-700 cursor-pointer">
                                    {locale === 'ar' ? 'تضمين اسم العميل في الرسالة' : 'Include customer name in message'}
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#2A303C]">
                                <button
                                    type="button"
                                    onClick={() => setEditingRule(null)}
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#2A303C] dark:hover:bg-[#3A404C] text-slate-700 dark:text-white font-medium rounded-xl transition-all"
                                >
                                    {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2"
                                >
                                    {isSaving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Save size={18} />}
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
