"use client"

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";

export default function AdminAutoReplySettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "error" | "success", text: string } | null>(null);
    const [formData, setFormData] = useState({
        autoReplyPrice: "0.1",
        pageAutoReplyPrice: "0.5",
        autoReplyEnabled: true
    });

    const { t, locale } = useLanguage();

    useEffect(() => {
        fetch('/api/admin/auto-reply-settings')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setFormData({
                        autoReplyPrice: data.autoReplyPrice?.toString() || "0.1",
                        pageAutoReplyPrice: data.pageAutoReplyPrice?.toString() || "0.5",
                        autoReplyEnabled: data.autoReplyEnabled !== false
                    });
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData(prev => ({ ...prev, [e.target.name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch("/api/admin/auto-reply-settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setMessage({ type: "success", text: locale === 'ar' ? "تم حفظ الإعدادات بنجاح!" : "Settings saved successfully!" });
            } else {
                setMessage({ type: "error", text: locale === 'ar' ? "فشل حفظ الإعدادات." : "Failed to save settings." });
            }
        } catch (error) {
            setMessage({ type: "error", text: locale === 'ar' ? "حدث خطأ ما." : "An error occurred." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="dark:text-white text-slate-900 px-4 md:px-8 py-6">{locale === 'ar' ? "جاري التحميل..." : "Loading..."}</div>;

    return (
        <div className="max-w-4xl mx-auto transition-colors duration-300 h-full flex flex-col pt-4">
            <header className="mb-6 md:mb-8 px-2 md:px-0">
                <h2 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900 tracking-tight">{t("adminAutoReplyConfig" as any)}</h2>
                <p className="dark:text-slate-400 text-slate-500 text-sm md:text-base mt-2 max-w-2xl leading-relaxed">{t("configureAutoReplySettings" as any)}</p>
            </header>

            {message && (
                <div className={`p-4 mb-6 rounded-lg text-sm font-medium mx-2 md:mx-0 ${message.type === 'error' ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50'}`}>
                    {message.text}
                </div>
            )}

            <div className="dark:bg-[#151921] bg-white rounded-xl border dark:border-[#2A303C] border-slate-200 p-6 md:p-8 shadow-sm transition-colors mx-2 md:mx-0 flex-grow">
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Price Setting */}
                    <div className="bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-[#2A303C] rounded-xl p-5 md:p-6 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1">
                                <label className={`block text-base font-semibold dark:text-slate-200 text-slate-800 mb-1 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                    {t("autoReplyPrice" as any)}
                                </label>
                                <p className={`text-sm dark:text-slate-400 text-slate-500 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                    {t("autoReplyPriceDesc" as any)}
                                </p>
                            </div>
                            <div className="w-full md:w-48" dir="ltr">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-slate-500 sm:text-sm">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        name="autoReplyPrice"
                                        value={formData.autoReplyPrice}
                                        onChange={handleChange}
                                        step="0.01"
                                        min="0"
                                        className="w-full pl-8 dark:bg-[#151921] bg-white border dark:border-[#2A303C] border-slate-300 rounded-lg px-4 py-3 font-medium dark:text-white text-slate-900 focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] shadow-sm transition-colors"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Page-Level Price Setting */}
                    <div className="bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-[#2A303C] rounded-xl p-5 md:p-6 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1">
                                <label className={`block text-base font-semibold dark:text-slate-200 text-slate-800 mb-1 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                    {locale === 'ar' ? 'سعر الرد الشامل للصفحات' : 'Page-Level Auto-Reply Price'}
                                </label>
                                <p className={`text-sm dark:text-slate-400 text-slate-500 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                    {locale === 'ar' ? 'التكلفة بالدولار لكل رد تلقائي على مستوى الصفحة بالكامل يتم إرساله.' : 'Cost in USD for each page-level auto-reply sent.'}
                                </p>
                            </div>
                            <div className="w-full md:w-48" dir="ltr">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-slate-500 sm:text-sm">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        name="pageAutoReplyPrice"
                                        value={formData.pageAutoReplyPrice}
                                        onChange={handleChange}
                                        step="0.01"
                                        min="0"
                                        className="w-full pl-8 dark:bg-[#151921] bg-white border dark:border-[#2A303C] border-slate-300 rounded-lg px-4 py-3 font-medium dark:text-white text-slate-900 focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] shadow-sm transition-colors"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enable/Disable Toggle */}
                    <div className="bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-[#2A303C] rounded-xl p-5 md:p-6 transition-colors">
                        <div className="flex flex-row items-center justify-between gap-4">
                            <div className="flex-1">
                                <label className={`block text-base font-semibold dark:text-slate-200 text-slate-800 mb-1 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                    {t("enableAutoReply" as any)}
                                </label>
                                <p className={`text-sm dark:text-slate-400 text-slate-500 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                    {locale === 'ar' ? "في حالة الإيقاف، لن يتم إرسال أي ردود ولن تظهر الميزة للمستخدمين." : "If disabled, no auto-replies will be sent and the feature will be hidden."}
                                </p>
                            </div>
                            <div className="flex items-center">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="autoReplyEnabled"
                                        checked={formData.autoReplyEnabled}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-slate-600 peer-checked:bg-[#1877F2]"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className={`pt-6 mt-4 border-t dark:border-[#2A303C] border-slate-200 flex ${locale === 'ar' ? 'justify-start' : 'justify-end'}`}>
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full md:w-auto px-8 py-3.5 bg-[#1877F2] hover:bg-blue-600 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t("saving" as any)}
                                </>
                            ) : t("saveConfiguration")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
