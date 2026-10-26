"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareShare, Users, Save, AlertCircle, ToggleRight, Sparkles, Bot, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import Link from "next/link";

export default function SetupAiPageAutoReply() {
    const router = useRouter();
    const { t, locale } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "error" | "success", text: string } | null>(null);
    const [conflictPrompt, setConflictPrompt] = useState<{ rule: any } | null>(null);

    // AI vs Static Reply Mode
    const [replyMode, setReplyMode] = useState<"AI" | "STATIC">("AI");

    // Global Config
    const [sysConfig, setSysConfig] = useState<any>(null);

    // Facebook Data
    const [allPages, setAllPages] = useState<any[]>([]);
    const [pages, setPages] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        pageId: "",
        replyTexts: ["", "", "", ""],
        privateMessage: "",
        includeName: true,
        activeDays: 30
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [configRes, pagesRes] = await Promise.all([
                    fetch('/api/auto-reply/config'),
                    fetch('/api/facebook/pages')
                ]);

                const configData = await configRes.json();
                setSysConfig(configData);

                const pagesData = await pagesRes.json();
                if (Array.isArray(pagesData)) {
                    setAllPages(pagesData);
                    const activePages = pagesData.filter(p => p.isAutoReplyActive === true);
                    setPages(activePages);

                    if (activePages.length > 0) {
                        setFormData(prev => ({ ...prev, pageId: activePages[0].id }));
                    }
                }
            } catch (error) {
                console.error(error);
                setMessage({ type: "error", text: t("errServerConnection" as any) });
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [t]);

    const handleReplyTextChange = (index: number, value: string) => {
        const newReplyTexts = [...formData.replyTexts];
        newReplyTexts[index] = value;
        setFormData({ ...formData, replyTexts: newReplyTexts });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.pageId) return setMessage({ type: "error", text: t("errSelectPage" as any) });

        if (replyMode === "STATIC") {
            const validReplies = formData.replyTexts.filter(t => t.trim() !== "");
            if (validReplies.length === 0) {
                return setMessage({ type: "error", text: locale === 'ar' ? "يرجى كتابة رد واحد على الأقل" : "Please enter at least one reply variant." });
            }
        }

        setSubmitting(true);
        setMessage(null);

        const payload = {
            ...formData,
            replyTexts: replyMode === "AI" ? ["__AI_REPLY__"] : formData.replyTexts.filter(t => t.trim() !== ""),
            pageId: formData.pageId
        };

        try {
            const res = await fetch("/api/page-auto-reply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({
                    type: "success",
                    text: locale === 'ar' 
                        ? (replyMode === "AI" ? "تم تفعيل الرد الشامل الذكي للصفحة بنجاح! 🤖" : "تم حفظ إعدادات الرد الشامل بنجاح!")
                        : "Page-level rule saved successfully!"
                });
                setTimeout(() => router.push('/dashboard/ai-page-auto-reply/manage'), 1500);
            } else if (res.status === 409 && data.error === "RULE_EXISTS") {
                setConflictPrompt({ rule: data.rule });
            } else {
                setMessage({ type: "error", text: data.error || (locale === 'ar' ? "فشل حفظ القاعدة" : "Failed to save rule") });
            }
        } catch (error) {
            setMessage({ type: "error", text: t("errServerConnection" as any) });
        } finally {
            setSubmitting(false);
        }
    };


    const handleExecuteAction = async (action: 'update' | 'extend') => {
        setSubmitting(true);
        setMessage(null);
        setConflictPrompt(null);

        const payload = {
            ...formData,
            replyTexts: replyMode === "AI" ? ["__AI_REPLY__"] : formData.replyTexts.filter(t => t.trim() !== ""),
            pageId: formData.pageId,
            updateOnly: action === 'update',
            extend: action === 'extend'
        };

        try {
            const res = await fetch("/api/page-auto-reply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({
                    type: "success",
                    text: locale === 'ar'
                        ? (action === 'update' 
                            ? "تم تحديث الصفحة وتحويلها إلى الرد الذكي بنجاح! 🤖" 
                            : "تم تمديد وتحديث قاعدة الرد الذكي بنجاح!")
                        : "Rule updated successfully!"
                });
                setTimeout(() => router.push('/dashboard/ai-page-auto-reply/manage'), 1500);
            } else {
                setMessage({ type: "error", text: data.error || (locale === 'ar' ? "فشل تنفيذ العملية" : "Failed to execute") });
            }
        } catch (error) {
            setMessage({ type: "error", text: t("errServerConnection" as any) });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <header className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20">
                            <Bot className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900 tracking-tight flex items-center gap-2">
                            {locale === 'ar' ? "الرد الشامل الذكي للصفحات (AI)" : "AI Page Auto-Reply"}
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-medium">
                                Nemotron AI
                            </span>
                        </h2>
                    </div>
                    <p className="dark:text-slate-400 text-slate-500 text-sm md:text-base">
                        {locale === 'ar'
                            ? "تفعيل وكيل الذكاء الاصطناعي على كافة منشورات الصفحة (الحالية والمستقبلية) ليرد بكلمات مختصرة ويوجّه العملاء للخاص."
                            : "Enable smart AI agent across all page posts to auto-reply politely and send details in private messages."}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link
                        href="/dashboard/ai-page-auto-reply/manage"
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {locale === 'ar' ? "إدارة الردود الشاملة" : "Manage Page Rules"}
                    </Link>
                </div>
            </header>

            {message && (
                <div className={`p-4 rounded-xl text-sm font-medium shadow-sm border ${message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="dark:bg-[#151921] bg-white rounded-2xl border dark:border-[#2A303C] border-slate-200 p-6 shadow-sm space-y-6">

                    {/* Mode Selector */}
                    <div>
                        <label className="block text-sm font-bold dark:text-slate-200 text-slate-800 mb-3">
                            {locale === 'ar' ? "اختر نوع الرد الشامل:" : "Select Reply Type:"}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setReplyMode("AI")}
                                className={`p-4 rounded-xl border-2 text-start transition-all flex items-start gap-3.5 ${replyMode === "AI" ? "border-purple-500 bg-purple-500/10 shadow-md shadow-purple-500/10" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-900/40"}`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${replyMode === "AI" ? "bg-purple-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>
                                    <Bot size={22} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                                            {locale === 'ar' ? "رد شامل ذكي بالذكاء الاصطناعي" : "Smart Page AI Agent"}
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600 text-white font-semibold">موصى به</span>
                                        </h4>
                                        {replyMode === "AI" && <CheckCircle2 size={18} className="text-purple-600 dark:text-purple-400" />}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                        {locale === 'ar' ? "يتولى الـ AI الرد بكلمات راقية ومختصرة على كل تعليق وتوجيه العميل للخاص لتفادي الحظر." : "AI generates custom, brief replies directing customers to DM automatically."}
                                    </p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setReplyMode("STATIC")}
                                className={`p-4 rounded-xl border-2 text-start transition-all flex items-start gap-3.5 ${replyMode === "STATIC" ? "border-indigo-500 bg-indigo-500/10 shadow-md shadow-indigo-500/10" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-900/40"}`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${replyMode === "STATIC" ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>
                                    <MessageSquareShare size={22} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                            {locale === 'ar' ? "رد شامل عادي (نصوص ثابتة)" : "Manual Static Variants"}
                                        </h4>
                                        {replyMode === "STATIC" && <CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400" />}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                        {locale === 'ar' ? "تحديد نصوص ثابتة مسبقاً يتم التناوب بينها عشوائياً للرد." : "Pick randomly from a set of fixed reply texts."}
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Page Selector */}
                    <div className="pt-4 border-t dark:border-slate-800 border-slate-100">
                        <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-2">
                            {t("selectPage" as any)}
                        </label>
                        {loading ? (
                            <div className="h-12 bg-slate-100 dark:bg-[#0B0E14] rounded-xl animate-pulse" />
                        ) : pages.length === 0 ? (
                            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 text-sm">
                                {locale === 'ar' ? "لا توجد صفحات مفعلة للرد التلقائي." : "No active pages."}
                            </div>
                        ) : (
                            <select
                                value={formData.pageId}
                                onChange={(e) => setFormData({ ...formData, pageId: e.target.value })}
                                className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-purple-500 transition-colors"
                            >
                                {pages.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.pageName} ({p.pageId})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* AI Mode Banner or Static Form */}
                    {replyMode === "AI" ? (
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-transparent border border-purple-500/30 space-y-4">
                            <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400 font-bold text-base">
                                <Sparkles className="w-5 h-5" />
                                {locale === 'ar' ? "وكيل الذكاء الاصطناعي الشامل (Nemotron 3 Ultra)" : "Nemotron 3 Ultra Global AI Agent"}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                {locale === 'ar'
                                    ? "سيعمل الذكاء الاصطناعي على كافة منشورات هذه الصفحة دون استثناء. كلما جاء تعليق، سيرد الذكاء الاصطناعي بكلمات راقية لا تتجاوز 3 كلمات تنبه العميل بالانتقال للخاص، ثم يرسل النظام رسالتك الخاصة تلقائياً."
                                    : "The AI agent will respond to comments on all posts for this page, keeping replies brief and polite."}
                            </p>
                            
                            <div className="p-3.5 bg-white/80 dark:bg-[#0B0E14]/80 rounded-xl border border-purple-500/20 space-y-2 text-xs">
                                <div className="text-slate-500 dark:text-slate-400 font-semibold">
                                    {locale === 'ar' ? "💡 نموذج الردود المتنوعة التي يصيغها الـ AI:" : "💡 Diverse AI Replies Preview:"}
                                </div>
                                <div className="space-y-1 text-purple-600 dark:text-purple-400 font-medium">
                                    <div>• "أهلاً بك، راجع رسائلك الخاصة 🤍"</div>
                                    <div>• "تم الرد في الخاص أخي العزيز ✨"</div>
                                    <div>• "أهلاً وسهلاً، تفاصيلك بالخاص 💕"</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Static Reply Inputs */
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700">
                                {locale === 'ar' ? "نماذج الردود الثابتة (سيتم التناوب بينها)" : "Reply Variants"}
                            </label>
                            {formData.replyTexts.map((text, idx) => (
                                <input
                                    key={idx}
                                    type="text"
                                    value={text}
                                    onChange={(e) => handleReplyTextChange(idx, e.target.value)}
                                    className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl px-4 py-2.5 text-sm dark:text-white text-slate-900"
                                    placeholder={locale === 'ar' ? `نموذج رد ${idx + 1}` : `Reply variant ${idx + 1}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Private Message (DM) */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700">
                                {locale === 'ar' ? "الرسالة الخاصة (تصل لصندوق بريد العميل في الخاص فوراً)" : "Private Message (Sent to DM immediately)"}
                            </label>
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                                {locale === 'ar' ? "الأسعار والتفاصيل" : "Price & Details"}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                            {locale === 'ar'
                                ? "اكتب تفاصيل المتجر والأسعار وأرقام التواصل. سيتم إرسالها للعميل تلقائياً في رسالة خاصة بعد كتابة الرد في التعليق."
                                : "Write store details, prices, and contacts here to send privately to the customer."}
                        </p>
                        <textarea
                            value={formData.privateMessage}
                            onChange={(e) => setFormData({ ...formData, privateMessage: e.target.value })}
                            rows={3}
                            className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl p-4 dark:text-white text-slate-900 focus:outline-none focus:border-purple-500 transition-colors"
                            placeholder={locale === 'ar' ? "أهلاً بك يا [الاسم]، تفاصيل المنتج والأسعار متوفرة لدينا كما يلي..." : "Hello [Name], product details..."}
                        />
                    </div>

                    {/* Options Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t dark:border-slate-800 border-slate-100">
                        {/* Include Name Toggle */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="includeNameCheckboxPage"
                                checked={formData.includeName}
                                onChange={(e) => setFormData({ ...formData, includeName: e.target.checked })}
                                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 border-slate-300 dark:border-slate-700 dark:bg-slate-900"
                            />
                            <label htmlFor="includeNameCheckboxPage" className="text-sm font-semibold dark:text-slate-300 text-slate-700 cursor-pointer">
                                {locale === 'ar' ? "تضمين اسم العميل في الرد" : "Include commenter's name"}
                            </label>
                        </div>

                        {/* Active Days */}
                        <div>
                            <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-1">
                                {locale === 'ar' ? "أيام التفعيل:" : "Active Days:"}
                            </label>
                            <div className="flex items-center p-1 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-[#2A303C] rounded-xl overflow-hidden w-full sm:w-max shadow-inner" dir="ltr">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, activeDays: Math.max(1, formData.activeDays - 1) })}
                                    className="w-10 h-9 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors bg-white dark:bg-[#151921] shadow-sm border border-slate-200 dark:border-[#2A303C]"
                                >
                                    -
                                </button>
                                <div className="w-20 text-center font-bold text-lg dark:text-white text-slate-900">
                                    {formData.activeDays}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, activeDays: formData.activeDays + 1 })}
                                    className="w-10 h-9 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors bg-white dark:bg-[#151921] shadow-sm border border-slate-200 dark:border-[#2A303C]"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all active:scale-95 flex items-center gap-2"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        {locale === 'ar' ? (replyMode === "AI" ? "تفعيل الرد الشامل الذكي 🤖" : "حفظ الإعدادات") : "Save Settings"}
                    </button>
                </div>
            </form>
        
            {/* Conflict / Existing Rule Resolution Modal */}
            {conflictPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#151921] rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-[#2A303C] overflow-hidden" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                        <div className="p-6">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 mx-auto ring-8 ring-purple-500/5">
                                <Sparkles size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">
                                {locale === 'ar' ? 'توجد قاعدة سابقة لهذه الصفحة!' : 'Rule Already Exists For This Page!'}
                            </h3>
                            <p className="text-center text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
                                {locale === 'ar' 
                                    ? `هذه الصفحة تحتوي مسبقاً على رد شامل مفعل (متبقي من صلاحيتها ${conflictPrompt.rule?.activeDays || 0} يوماً). كيف تود المتابعة؟`
                                    : `This page already has an active auto-reply rule (${conflictPrompt.rule?.activeDays || 0} active days remaining). How would you like to proceed?`}
                            </p>
                            <div className="space-y-2.5">
                                <button
                                    onClick={() => handleExecuteAction('update')}
                                    disabled={submitting}
                                    type="button"
                                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Bot size={18} />
                                    {locale === 'ar' ? 'تحويل للرد الذكي مع الحفاظ على الأيام (مجاناً)' : 'Convert to AI Keeping Active Days (Free)'}
                                </button>
                                
                                <button
                                    onClick={() => handleExecuteAction('extend')}
                                    disabled={submitting}
                                    type="button"
                                    className="w-full px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {locale === 'ar' ? `تحديث + تمديد الصلاحية (+${formData.activeDays} يوم)` : `Update + Extend (+${formData.activeDays} days)`}
                                </button>

                                <button
                                    onClick={() => setConflictPrompt(null)}
                                    disabled={submitting}
                                    type="button"
                                    className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors text-sm"
                                >
                                    {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
