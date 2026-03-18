"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircleReply, Users, Save, AlertCircle, DollarSign, Settings, ToggleRight, MessageSquareShare, ListPlus } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import Link from "next/link";

export default function SetupPageAutoReply() {
    const router = useRouter();
    const { t, locale } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "error" | "success", text: string } | null>(null);

    // Global Config
    const [sysConfig, setSysConfig] = useState({ pageAutoReplyPrice: 0.5, autoReplyEnabled: true });

    // Facebook Data
    const [allPages, setAllPages] = useState<any[]>([]); // Store all connected pages
    const [pages, setPages] = useState<any[]>([]); // Store only active pages for the dropdown

    // Form State
    const [formData, setFormData] = useState({
        pageId: "",
        replyTexts: ["", "", "", ""], // 4 variants
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

                    // Filter for only activated pages
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
        
        const validReplies = formData.replyTexts.filter(t => t.trim() !== "");
        if (validReplies.length === 0) {
            return setMessage({ type: "error", text: locale === 'ar' ? "يرجى كتابة رد واحد على الأقل" : "Please enter at least one reply variant." });
        }

        setSubmitting(true);
        setMessage(null);

        try {
            const res = await fetch("/api/page-auto-reply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pageId: formData.pageId,
                    replyTexts: validReplies,
                    privateMessage: formData.privateMessage,
                    includeName: formData.includeName,
                    activeDays: formData.activeDays
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: "success", text: locale === 'ar' ? "تم حفظ قاعدة الصفحة بنجاح!" : "Page rule saved successfully!" });
                setTimeout(() => router.push('/dashboard/page-auto-reply/manage'), 1500);
            } else {
                setMessage({ type: "error", text: data.error || (locale === 'ar' ? "فشل الحفظ" : "Failed to save") });
            }
        } catch (error) {
            setMessage({ type: "error", text: t("errServerConnection" as any) });
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

    if (allPages.length > 0 && pages.length === 0) {
        return (
            <div className="max-w-3xl mx-auto p-12 text-center bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4 opacity-80" />
                <h2 className="text-xl font-bold text-amber-700 dark:text-amber-400 mb-4">
                    {locale === 'ar' ? "لا توجد صفحات مفعلة" : "No Activated Pages"}
                </h2>
                <p className="text-amber-600 dark:text-amber-500 mb-8 max-w-md mx-auto">
                    {locale === 'ar'
                        ? "لديك صفحات مرتبطة ولكن لم تقم بتفعيل أي منها للرد التلقائي (إعطاء صلاحية Webhooks). يرجى تفعيل صفحة أولاً."
                        : "You have connected pages, but none are activated for Auto-Replies (Webhooks disabled). Please activate a page first."}
                </p>
                <Link
                    href="/dashboard/auto-reply/pages"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl shadow-sm transition-colors"
                >
                    {locale === 'ar' ? "الذهاب لصفحة التفعيل" : "Go to Activate Pages"}
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto transition-colors duration-300 min-h-[500px]" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <header className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                            <MessageSquareShare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900 tracking-tight">
                            {locale === 'ar' ? 'الرد التلقائي الشامل للصفحة' : 'Page-Level Auto-Reply'}
                        </h2>
                    </div>
                    <p className="dark:text-slate-400 text-slate-500 text-sm md:text-base">
                        {locale === 'ar' 
                        ? 'إعداد ردود تلقائية تعمل على جميع المنشورات الجديدة وتتغير عشوائياً لمنع الحظر الاستباقي (Spam).' 
                        : 'Set up global auto-replies for all new posts. Replies change randomly to prevent spam flags.'}
                    </p>

                    <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-full text-indigo-700 dark:text-indigo-300 text-sm font-medium">
                            <DollarSign size={16} />
                            {locale === 'ar' ? `التكلفة: $${sysConfig.pageAutoReplyPrice} لكل 30 يوم` : `Cost: $${sysConfig.pageAutoReplyPrice} per 30 days`}
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-full text-emerald-700 dark:text-emerald-300 text-sm font-bold shadow-sm">
                            {locale === 'ar' ? `إجمالي الدفع المسبق: $${((formData.activeDays / 30) * sysConfig.pageAutoReplyPrice).toFixed(2)}` : `Total Upfront Cost: $${((formData.activeDays / 30) * sysConfig.pageAutoReplyPrice).toFixed(2)}`}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href="/dashboard/auto-reply/pages"
                        className="px-6 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0"
                    >
                        <ToggleRight size={18} />
                        {locale === 'ar' ? 'تفعيل الصفحات' : 'Activate Pages'}
                    </Link>
                    <Link
                        href="/dashboard/page-auto-reply/manage"
                        className="px-6 py-2.5 bg-white dark:bg-[#151921] border border-slate-200 dark:border-[#2A303C] hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-medium rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0"
                    >
                        <Settings size={18} />
                        {locale === 'ar' ? 'إدارة الردود الشاملة' : 'Manage Page Rules'}
                    </Link>
                </div>
            </header>

            {message && (
                <div className={`p-4 mb-6 rounded-xl text-sm font-medium shadow-sm border ${message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Facebook Page Selection & Settings */}
                <div className="dark:bg-[#151921] bg-white rounded-2xl border dark:border-[#2A303C] border-slate-200 shadow-sm p-6 md:p-8">
                    <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm">1</span>
                        {locale === 'ar' ? "إعدادات الصفحة" : "Page Settings"}
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

                        {/* Active Days */}
                        <div>
                            <label className={`block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-1 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                {locale === 'ar' ? "أيام التفعيل" : "Active Days"}
                            </label>
                            <p className={`text-xs dark:text-slate-500 text-slate-400 mb-2 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                {locale === 'ar' ? "عدد الأيام التي سيظل فيها الرد يعمل على أي منشور جديد في هذه الصفحة." : "Number of days the auto-reply will remain active for new posts."}
                            </p>
                            <input
                                type="number"
                                min="1"
                                value={formData.activeDays}
                                onChange={(e) => setFormData({ ...formData, activeDays: parseInt(e.target.value) || 1 })}
                                className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                placeholder="30"
                                dir="ltr"
                            />
                        </div>
                    </div>
                </div>

                {/* Reply Configuration */}
                <div className="dark:bg-[#151921] bg-white rounded-2xl border dark:border-[#2A303C] border-slate-200 shadow-sm p-6 md:p-8">
                    <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm">2</span>
                        {locale === 'ar' ? "إعدادات الرد (متغير للحماية من الحظر)" : "Reply Configuration (Spam Protection)"}
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

                        {/* Multiple Reply Texts */}
                        <div>
                            <label className={`block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-2 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                {locale === 'ar' ? "نماذج الردود" : "Reply Templates"} <span className="text-red-500">*</span>
                            </label>
                            <p className={`text-xs dark:text-slate-500 text-slate-400 mb-4 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                {locale === 'ar' ? "اكتب حتى 4 ردود مختلفة. سيقوم النظام باختيار واحد منها عشوائياً لكل تعليق جديد لتبدو الردود بأنها بشرية وتتجنب حظر الفيسبوك. يجب كتابة إرد واحد على الأقل." : "Write up to 4 different replies. The system will picked one randomly for each new comment to appear natural and avoid Facebook triggers. At least one is required."}
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[0, 1, 2, 3].map((index) => (
                                    <div key={index} className="relative">
                                        <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-xs font-bold pointer-events-none">
                                            {index + 1}
                                        </div>
                                        <textarea
                                            value={formData.replyTexts[index]}
                                            onChange={(e) => handleReplyTextChange(index, e.target.value)}
                                            rows={3}
                                            className={`w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl py-3 dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none ${locale === 'ar' ? 'pr-12' : 'pl-12'}`}
                                            placeholder={locale === 'ar' ? `مثال على الرد ${index + 1}...` : `Reply example ${index + 1}...`}
                                            required={index === 0} // Only first is required
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Private Message */}
                        <div>
                            <label className={`block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-1 flex justify-between ${locale === 'ar' ? 'text-right flex-row-reverse' : 'text-left'}`}>
                                <span>{locale === 'ar' ? "الرسالة الخاصة (اختياري)" : "Private Message (Optional)"}</span>
                            </label>
                            <p className={`text-xs dark:text-slate-500 text-slate-400 mb-2 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                {locale === 'ar' ? "سيتم إرسال هذه الرسالة إلى صندوق ورود المعلق (Direct Message) بالإضافة إلى الرد العام." : "This message will be sent to the commenter's inbox (DM) in addition to the public reply."}
                            </p>
                            <textarea
                                value={formData.privateMessage}
                                onChange={(e) => setFormData({ ...formData, privateMessage: e.target.value })}
                                rows={4}
                                className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-xl px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
                                placeholder={locale === 'ar' ? "مرحباً! لقد قمنا بإرسال تفاصيل طلبك... (اختياري)" : "Hi! We have sent you the details... (Optional)"}
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
                        {locale === 'ar' ? 'حفظ إعدادات الصفحة' : 'Save Page Rules'}
                    </button>
                </div>
            </form>
        </div>
    );
}
