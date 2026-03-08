"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircleReply, Users, Save, AlertCircle, DollarSign, Settings } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import Link from "next/link";

export default function SetupAutoReply() {
    const router = useRouter();
    const { t, locale } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "error" | "success", text: string } | null>(null);

    // Global Config
    const [sysConfig, setSysConfig] = useState({ autoReplyPrice: 0.1, autoReplyEnabled: true });

    // Facebook Data
    const [pages, setPages] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        pageId: "",
        postId: "",
        replyText: "",
        includeName: true,
        keywords: ""
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
                    setPages(pagesData);
                    if (pagesData.length > 0) {
                        setFormData(prev => ({ ...prev, pageId: pagesData[0].id }));
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
    }, [formData.pageId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.pageId) return setMessage({ type: "error", text: t("errSelectPage" as any) });
        if (!formData.postId) return setMessage({ type: "error", text: t("errSelectPost" as any) });
        if (!formData.replyText.trim()) return setMessage({ type: "error", text: locale === 'ar' ? "يرجى كتابة رسالة الرد" : "Please enter a reply message" });

        setSubmitting(true);
        setMessage(null);

        try {
            const res = await fetch("/api/auto-reply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: "success", text: locale === 'ar' ? "تم حفظ القاعدة بنجاح!" : "Rule saved successfully!" });
                setTimeout(() => router.push('/dashboard/auto-reply/manage'), 1500);
            } else {
                setMessage({ type: "error", text: data.error || (locale === 'ar' ? "فشل الحفظ" : "Failed to save") });
            }
        } catch (error) {
            setMessage({ type: "error", text: t("errServerConnection") });
        } finally {
            setSubmitting(false);
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
        <div className="max-w-4xl mx-auto transition-colors duration-300 min-h-[500px]" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <header className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                            <MessageCircleReply className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900 tracking-tight">{t("setupAutoReply" as any)}</h2>
                    </div>
                    <p className="dark:text-slate-400 text-slate-500 text-sm md:text-base">{t("setupAutoReplyDesc" as any)}</p>

                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-full text-indigo-700 dark:text-indigo-300 text-sm font-medium">
                        <DollarSign size={16} />
                        {t("costPerReply" as any)} ${sysConfig.autoReplyPrice}
                    </div>
                </div>

                <Link
                    href="/dashboard/auto-reply/manage"
                    className="px-6 py-2.5 bg-white dark:bg-[#151921] border border-slate-200 dark:border-[#2A303C] hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-medium rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0"
                >
                    <Settings size={18} />
                    {locale === 'ar' ? 'إدارة الردود الحالية' : 'Manage Existing Rules'}
                </Link>
            </header>

            {message && (
                <div className={`p-4 mb-6 rounded-xl text-sm font-medium shadow-sm border ${message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Facebook Post Selection */}
                <div className="dark:bg-[#151921] bg-white rounded-2xl border dark:border-[#2A303C] border-slate-200 shadow-sm p-6 md:p-8">
                    <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm">1</span>
                        {t("pageAndPost" as any)}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={`block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-2 flex items-center gap-2 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                {t("facebookPage" as any)}
                            </label>
                            <select
                                value={formData.pageId}
                                onChange={(e) => setFormData({ ...formData, pageId: e.target.value })}
                                className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                            >
                                {pages.length === 0 && <option value="" disabled>{t("noPagesLinked" as any)}</option>}
                                {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className={`block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-2 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                {t("targetPost" as any)}
                            </label>
                            {loadingPosts ? (
                                <div className={`w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl px-4 py-3 dark:text-slate-500 text-slate-500 animate-pulse ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                    {t("fetching" as any)}
                                </div>
                            ) : (
                                <select
                                    value={formData.postId}
                                    onChange={(e) => setFormData({ ...formData, postId: e.target.value })}
                                    className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    dir="ltr"
                                >
                                    <option value="" disabled>{t("selectAPost" as any)}</option>
                                    {posts.map((post: any) => {
                                        const purePostId = post.id.includes('_') ? post.id.split('_')[1] : post.id;
                                        return (
                                            <option key={post.id} value={purePostId}>
                                                {post.message ? post.message.substring(0, 60) + "..." : t("mediaPost" as any)}
                                            </option>
                                        )
                                    })}
                                </select>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reply Configuration */}
                <div className="dark:bg-[#151921] bg-white rounded-2xl border dark:border-[#2A303C] border-slate-200 shadow-sm p-6 md:p-8">
                    <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm">2</span>
                        {locale === 'ar' ? "إعدادات الرد" : "Reply Configuration"}
                    </h3>

                    <div className="space-y-6">
                        {/* Include Name Toggle */}
                        <div className="flex flex-row items-center justify-between p-4 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-[#2A303C] rounded-xl">
                            <div>
                                <label className="block text-sm font-semibold dark:text-slate-200 text-slate-800 mb-1">
                                    {t("includeName" as any)}
                                </label>
                                <p className="text-xs dark:text-slate-500 text-slate-500">
                                    {t("includeNameDesc" as any)}
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.includeName}
                                    onChange={(e) => setFormData({ ...formData, includeName: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        {/* Reply Text */}
                        <div>
                            <label className={`block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-2 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                {t("replyMessage" as any)} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.replyText}
                                onChange={(e) => setFormData({ ...formData, replyText: e.target.value })}
                                rows={4}
                                className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
                                placeholder={t("replyMessagePlaceholder" as any)}
                                required
                            />
                            {/* Preview */}
                            {formData.replyText && (
                                <div className="mt-3 p-3 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg text-sm dark:text-indigo-200 text-indigo-800">
                                    <span className="font-semibold opacity-70 block mb-1">{locale === 'ar' ? "مثال للرد:" : "Preview:"}</span>
                                    {formData.includeName ? (locale === 'ar' ? "مرحباً محمد، " : "Hi John, ") : ""}{formData.replyText}
                                </div>
                            )}
                        </div>

                        {/* Keywords */}
                        <div>
                            <label className={`block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-1 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                {t("triggerKeywords" as any)}
                            </label>
                            <p className="text-xs dark:text-slate-500 text-slate-400 mb-2">{t("triggerKeywordsDesc" as any)}</p>
                            <input
                                type="text"
                                value={formData.keywords}
                                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                                className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                placeholder={locale === 'ar' ? "سعر, بكام, تفاصيل" : "price, details, how much"}
                            />
                        </div>
                    </div>
                </div>

                <div className={`flex ${locale === 'ar' ? 'justify-start' : 'justify-end'}`}>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <Save size={20} />
                        )}
                        {t("saveRule" as any)}
                    </button>
                </div>
            </form>
        </div>
    );
}
