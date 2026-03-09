"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { MessageCircleReply, AlertCircle, CheckCircle2, Flag } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

function ActivatePagesContent() {
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<Record<string, boolean>>({});
    const [message, setMessage] = useState<{ type: "error" | "success", text: string } | null>(null);

    const { t, locale } = useLanguage();

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            const res = await fetch('/api/facebook/pages');
            const data = await res.json();
            if (Array.isArray(data)) {
                setPages(data);
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: "error", text: locale === 'ar' ? "فشل تحميل الصفحات" : "Failed to load pages" });
        } finally {
            setLoading(false);
        }
    }

    const toggleActivation = async (page: any) => {
        setProcessing(prev => ({ ...prev, [page.id]: true }));
        setMessage(null);

        try {
            // If currently active, we want to deactivate, and vice versa.
            const endpoint = page.isAutoReplyActive
                ? "/api/auto-reply/deactivate-page"
                : "/api/auto-reply/activate-page";

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pageId: page.pageId })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setMessage({
                    type: "success",
                    text: page.isAutoReplyActive
                        ? (locale === 'ar' ? `تم إيقاف الرد التلقائي لصفحة ${page.pageName}` : `Auto-replies deactivated for ${page.pageName}`)
                        : (locale === 'ar' ? `تم تفعيل الرد التلقائي لصفحة ${page.pageName} بنجاح!` : `Auto-replies activated for ${page.pageName}!`)
                });

                // Update local state
                setPages(pages.map(p =>
                    p.id === page.id ? { ...p, isAutoReplyActive: !p.isAutoReplyActive } : p
                ));
            } else {
                setMessage({ type: "error", text: data.error || (locale === 'ar' ? "فشلت العملية" : "Operation failed") });
            }
        } catch (error) {
            setMessage({ type: "error", text: locale === 'ar' ? "خطأ في الاتصال بالخادم" : "Server connection error" });
        } finally {
            setProcessing(prev => ({ ...prev, [page.id]: false }));
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <header className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                            <MessageCircleReply className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900 tracking-tight">
                            {locale === 'ar' ? "تفعيل الصفحات للرد التلقائي" : "Activate Pages for Auto-Reply"}
                        </h2>
                    </div>
                    <p className="dark:text-slate-400 text-slate-500 text-sm md:text-base">
                        {locale === 'ar'
                            ? "يجب تفعيل الصفحة أولاً بالسماح للتطبيق بالاستماع للتعليقات (Webhooks) قبل إعداد قواعد الرد."
                            : "You must activate a page first to allow the app to listen to comments (Webhooks) before setting up reply rules."}
                    </p>
                </div>
            </header>

            {message && (
                <div className={`p-4 rounded-xl text-sm font-medium shadow-sm border ${message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'}`}>
                    {message.text}
                </div>
            )}

            <div className="dark:bg-[#151921] bg-white rounded-2xl border dark:border-[#2A303C] border-slate-200 overflow-hidden shadow-sm h-full transition-colors">
                <div className="p-6 border-b dark:border-[#2A303C] border-slate-200 bg-slate-50/50 dark:bg-[#0B0E14]/50">
                    <h3 className="text-lg font-medium dark:text-white text-slate-900">{t("facebookPages" as any)}</h3>
                </div>
                {loading ? (
                    <div className="p-12 text-center dark:text-slate-400 text-slate-500">
                        <div className="inline-block w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                        <div>{locale === 'ar' ? "جاري تحميل الصفحات..." : "Loading pages..."}</div>
                    </div>
                ) : pages.length === 0 ? (
                    <div className="p-16 text-center flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                            <Flag size={40} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-2">{t("noPagesLinked" as any)}</h3>
                        <p className="dark:text-slate-400 text-slate-500 text-sm max-w-sm mb-6">
                            {locale === 'ar' ? "يرجى ربط حساب فيسبوك الخاص بك أولاً لعرض الصفحات المتاحة." : "Please connect your Facebook account first to view available pages."}
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y dark:divide-[#2A303C] divide-slate-100">
                        {pages.map(page => (
                            <li key={page.id} className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:hover:bg-[#0B0E14]/30 hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-sm overflow-hidden shrink-0">
                                        {page.picture?.data?.url ? (
                                            <img src={page.picture.data.url} alt={page.pageName} className="w-full h-full object-cover" />
                                        ) : (
                                            <Flag size={24} strokeWidth={2} />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-base font-semibold dark:text-white text-slate-900 flex items-center gap-2">
                                            {page.pageName}
                                            {page.status === 'ACTIVE' && (
                                                <span className="flex h-2 w-2 relative" title="Business Manager Connected">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                </span>
                                            )}
                                        </h4>
                                        <p className="dark:text-slate-500 text-slate-500 text-xs mt-1 font-mono">{page.pageId}</p>
                                    </div>
                                </div>
                                <div className="flex items-center sm:justify-end">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={page.isAutoReplyActive}
                                            onChange={() => toggleActivation(page)}
                                            disabled={processing[page.id]}
                                            className="sr-only peer"
                                        />
                                        <div className={`w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:${locale === 'ar' ? '-translate-x-full' : 'translate-x-[26px]'} peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:${locale === 'ar' ? 'right-[2px]' : 'left-[2px]'} after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500 ${processing[page.id] ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                                        <span className={`ms-3 text-sm font-medium ${page.isAutoReplyActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {processing[page.id] ? (
                                                <span className="inline-block animate-pulse">{locale === 'ar' ? "جاري..." : "Processing..."}</span>
                                            ) : page.isAutoReplyActive ? (
                                                <span className="flex items-center gap-1"><CheckCircle2 size={16} /> {locale === 'ar' ? "مفعل" : "Active"}</span>
                                            ) : (
                                                <span className="flex items-center gap-1">{locale === 'ar' ? "غير مفعل" : "Inactive"}</span>
                                            )}
                                        </span>
                                    </label>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default function ActivatePages() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading Configuration...</div>}>
            <ActivatePagesContent />
        </Suspense>
    );
}
