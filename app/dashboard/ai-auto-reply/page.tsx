"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircleReply, Users, Save, AlertCircle, DollarSign, Settings, ToggleRight, Sparkles, Bot, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import Link from "next/link";

export default function SetupAiAutoReply() {
    const router = useRouter();
    const { t, locale } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "error" | "success", text: string } | null>(null);
    const [duplicateWarning, setDuplicateWarning] = useState(false);

    // AI vs Static Reply Mode (Default: AI)
    const [replyMode, setReplyMode] = useState<"AI" | "STATIC">("AI");

    // Global Config
    const [sysConfig, setSysConfig] = useState({ autoReplyPrice: 0.1, autoReplyEnabled: true });

    // Facebook Data
    const [allPages, setAllPages] = useState<any[]>([]);
    const [pages, setPages] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        pageId: "",
        postId: "",
        replyText: "",
        replyText2: "",
        replyText3: "",
        privateMessage: "",
        includeName: true,
        keywords: "",
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

    useEffect(() => {
        if (!formData.pageId) return;

        const fetchPosts = async () => {
            setLoadingPosts(true);
            const selectedPage = pages.find(p => p.id === formData.pageId);
            if (!selectedPage) {
                setLoadingPosts(false);
                return;
            }

            try {
                const res = await fetch(`/api/facebook/posts?pageId=${formData.pageId}`);
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setPosts(data);
                    const firstPostId = data[0].id;
                    const purePostId = firstPostId.includes('_') ? firstPostId.split('_')[1] : firstPostId;
                    setFormData(prev => ({ ...prev, postId: purePostId }));
                } else {
                    setPosts([]);
                    setFormData(prev => ({ ...prev, postId: "" }));
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingPosts(false);
            }
        };
        fetchPosts();
    }, [formData.pageId, pages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.pageId) return setMessage({ type: "error", text: t("errSelectPage" as any) });
        if (!formData.postId) return setMessage({ type: "error", text: t("errSelectPost" as any) });
        
        if (replyMode === "STATIC" && !formData.replyText.trim()) {
            return setMessage({ type: "error", text: locale === 'ar' ? "يرجى كتابة رسالة الرد" : "Please enter a reply message" });
        }

        setSubmitting(true);
        setMessage(null);

        const replyPayload = {
            ...formData,
            replyText: replyMode === "AI" ? "__AI_REPLY__" : formData.replyText,
            replyText2: replyMode === "AI" ? "" : formData.replyText2,
            replyText3: replyMode === "AI" ? "" : formData.replyText3,
            pageId: formData.pageId
        };

        try {
            const res = await fetch("/api/auto-reply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(replyPayload)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ 
                    type: "success", 
                    text: locale === 'ar' 
                        ? (replyMode === "AI" ? "تم تفعيل الرد الذكي بالذكاء الاصطناعي للمنشور بنجاح! 🤖" : "تم حفظ القاعدة بنجاح!") 
                        : "Rule saved successfully!" 
                });
                setTimeout(() => router.push('/dashboard/ai-auto-reply/manage'), 1500);
            } else {
                if (data.isDuplicate) {
                    setDuplicateWarning(true);
                } else {
                    setMessage({ type: "error", text: data.error || (locale === 'ar' ? "فشل حفظ القاعدة" : "Failed to save rule") });
                }
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
                            {locale === 'ar' ? "الرد الذكي للمنشورات بالذكاء الاصطناعي" : "AI Post Auto-Reply"}
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-medium">
                                Nemotron AI
                            </span>
                        </h2>
                    </div>
                    <p className="dark:text-slate-400 text-slate-500 text-sm md:text-base">
                        {locale === 'ar'
                            ? "استخدم وكيل الذكاء الاصطناعي للرد تلقائياً على تعليقات المنشور بأسلوب مهذب ومختصر وموجّه للشراء عبر الرسائل الخاصة."
                            : "Use intelligent AI agent to auto-reply to post comments politely and direct buyers to private messages."}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link
                        href="/dashboard/ai-auto-reply/manage"
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {locale === 'ar' ? "إدارة الردود الذكية" : "Manage AI Rules"}
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
                            {locale === 'ar' ? "اختر نوع الرد:" : "Select Reply Type:"}
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
                                            {locale === 'ar' ? "رد ذكي بالذكاء الاصطناعي" : "Smart AI Agent"}
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600 text-white font-semibold">موصى به</span>
                                        </h4>
                                        {replyMode === "AI" && <CheckCircle2 size={18} className="text-purple-600 dark:text-purple-400" />}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                        {locale === 'ar' ? "ردود ذكية، راقية، ومختصرة متنوعة تلقائياً توجه العميل للخاص وتمنع حظر فيسبوك." : "Smart, brief, diverse replies that direct customers to private messages safely."}
                                    </p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setReplyMode("STATIC")}
                                className={`p-4 rounded-xl border-2 text-start transition-all flex items-start gap-3.5 ${replyMode === "STATIC" ? "border-indigo-500 bg-indigo-500/10 shadow-md shadow-indigo-500/10" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-900/40"}`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${replyMode === "STATIC" ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>
                                    <MessageCircleReply size={22} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                            {locale === 'ar' ? "رد عادي (نصوص ثابتة)" : "Manual Static Reply"}
                                        </h4>
                                        {replyMode === "STATIC" && <CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400" />}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                        {locale === 'ar' ? "كتابة نصوص ثابتة مسبقاً لاختيار واحد منها عشوائياً للرد." : "Specify fixed text variants to randomly reply with."}
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Page & Post Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t dark:border-slate-800 border-slate-100">
                        {/* Page Selector */}
                        <div>
                            <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-2">
                                {t("selectPage" as any)}
                            </label>
                            {loading ? (
                                <div className="h-12 bg-slate-100 dark:bg-[#0B0E14] rounded-xl animate-pulse" />
                            ) : pages.length === 0 ? (
                                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 text-sm">
                                    {allPages.length > 0 
                                        ? (locale === 'ar' ? "لديك صفحات ولكنها غير مفعلة للرد التلقائي. يرجى تفعيلها أولاً." : "Pages connected but not activated.")
                                        : t("noPagesLinked" as any)}
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

                        {/* Post Selector */}
                        <div>
                            <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-2">
                                {t("selectPost" as any)}
                            </label>
                            {loadingPosts ? (
                                <div className="h-12 bg-slate-100 dark:bg-[#0B0E14] rounded-xl animate-pulse" />
                            ) : posts.length === 0 ? (
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-[#2A303C] text-slate-500 text-sm">
                                    {t("noPostsFound" as any)}
                                </div>
                            ) : (
                                <select
                                    value={formData.postId}
                                    onChange={(e) => setFormData({ ...formData, postId: e.target.value })}
                                    className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-purple-500 transition-colors"
                                >
                                    {posts.map((post) => (
                                        <option key={post.id} value={post.id.includes('_') ? post.id.split('_')[1] : post.id}>
                                            {post.message ? post.message.substring(0, 50) + '...' : `منشور (${post.id.substring(0, 10)}...)`}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* AI Mode Banner or Static Form */}
                    {replyMode === "AI" ? (
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-transparent border border-purple-500/30 space-y-4">
                            <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400 font-bold text-base">
                                <Sparkles className="w-5 h-5" />
                                {locale === 'ar' ? "وكيل الذكاء الاصطناعي (Nemotron 3 Ultra)" : "Nemotron 3 Ultra AI Agent"}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                {locale === 'ar'
                                    ? "سيتولى الذكاء الاصطناعي الرد تلقائياً على كل تعليق بأسلوب مهذب ومختصر (أقل من 3 كلمات) ينبه العميل بمراجعة رسائله الخاصة فوراً لتجنب حظر فيسبوك للتكرار، مع توجيهه بلطف."
                                    : "The AI agent will generate short, polite, unique replies (under 3 words) directing commenters to their private messages."}
                            </p>
                            
                            {/* Live Demo Preview Box */}
                            <div className="p-3.5 bg-white/80 dark:bg-[#0B0E14]/80 rounded-xl border border-purple-500/20 space-y-2 text-xs">
                                <div className="text-slate-500 dark:text-slate-400 font-semibold">
                                    {locale === 'ar' ? "💡 نموذج حي للرد الذي سيقوم به الـ AI:" : "💡 Live Reply Preview:"}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{locale === 'ar' ? "تعليق العميل:" : "Customer:"}</span>
                                    <span className="text-slate-600 dark:text-slate-400">بكم السعر وهل يوجد توصيل؟</span>
                                </div>
                                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium">
                                    <span>{locale === 'ar' ? "رد الذكاء الاصطناعي:" : "AI Reply:"}</span>
                                    <span>أهلاً بك، راجع رسائلك الخاصة 🤍</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Static Reply Inputs */
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-2">
                                    {locale === 'ar' ? "نص الرد الأساسي" : "Primary Reply Text"}
                                </label>
                                <textarea
                                    value={formData.replyText}
                                    onChange={(e) => setFormData({ ...formData, replyText: e.target.value })}
                                    rows={2}
                                    className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl p-4 dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder={locale === 'ar' ? "أهلاً بك، تم الرد على الخاص 💕" : "Hi, replied in DM 💕"}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium dark:text-slate-400 text-slate-600 mb-1">
                                        {locale === 'ar' ? "خيار رد بديل 2 (اختياري)" : "Alternative Reply 2"}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.replyText2}
                                        onChange={(e) => setFormData({ ...formData, replyText2: e.target.value })}
                                        className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl px-3 py-2 text-sm dark:text-white text-slate-900"
                                        placeholder={locale === 'ar' ? "تم التواصل معك في الخاص 🌸" : "Sent you a message 🌸"}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium dark:text-slate-400 text-slate-600 mb-1">
                                        {locale === 'ar' ? "خيار رد بديل 3 (اختياري)" : "Alternative Reply 3"}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.replyText3}
                                        onChange={(e) => setFormData({ ...formData, replyText3: e.target.value })}
                                        className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl px-3 py-2 text-sm dark:text-white text-slate-900"
                                        placeholder={locale === 'ar' ? "راجع رسائلك الخاصة أخي العزيز ✨" : "Check your inbox ✨"}
                                    />
                                </div>
                            </div>
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
                                ? "اكتب هنا تفاصيل المنتج، الأسعار، وأرقام التواصل. سيتم إرسالها للعميل تلقائياً في رسالة خاصة بعد كتابة الرد في التعليق."
                                : "Write product details, pricing, and contact numbers here. It will be sent via private message to the commenter."}
                        </p>
                        <textarea
                            value={formData.privateMessage}
                            onChange={(e) => setFormData({ ...formData, privateMessage: e.target.value })}
                            rows={3}
                            className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl p-4 dark:text-white text-slate-900 focus:outline-none focus:border-purple-500 transition-colors"
                            placeholder={locale === 'ar' ? "أهلاً بك يا [الاسم]، سعر المنتج هو 150 د.ل والتوصيل متوفر لجميع المدن. للطلب تواصل معنا على واتساب..." : "Hello [Name], the price is..."}
                        />
                    </div>

                    {/* Options Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t dark:border-slate-800 border-slate-100">
                        {/* Include Name Toggle */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="includeNameCheckbox"
                                checked={formData.includeName}
                                onChange={(e) => setFormData({ ...formData, includeName: e.target.checked })}
                                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 border-slate-300 dark:border-slate-700 dark:bg-slate-900"
                            />
                            <label htmlFor="includeNameCheckbox" className="text-sm font-semibold dark:text-slate-300 text-slate-700 cursor-pointer">
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
                        {locale === 'ar' ? (replyMode === "AI" ? "تفعيل الرد الذكي الآن 🤖" : "حفظ القاعدة") : "Save Rule"}
                    </button>
                </div>
            </form>
        </div>
    );
}
