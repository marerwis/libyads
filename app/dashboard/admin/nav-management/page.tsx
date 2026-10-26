"use client"

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Eye, EyeOff, RefreshCw, Sparkles, CheckCircle2, AlertCircle, Compass, LayoutDashboard, Bot, MessageCircleReply, MessageSquareShare, Flag, ExternalLink } from "lucide-react";

export default function NavManagementPage() {
    const { t, locale } = useLanguage();

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

    useEffect(() => {
        fetchNavItems();
    }, []);

    const fetchNavItems = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/nav-settings");
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setItems(data);
            } else {
                setMessage({ type: "error", text: data.error || "Failed to load pages" });
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setMessage({ type: "error", text: locale === 'ar' ? "فشل الاتصال بالسيرفر" : "Server error" });
        } finally {
            setLoading(false);
        }
    };

    // Toggle visibility of a page
    const togglePageVisibility = async (key: string, currentStatus: boolean) => {
        setActionLoading(key);
        setMessage(null);
        const nextState = !currentStatus;

        try {
            const res = await fetch("/api/admin/nav-settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, isVisible: nextState })
            });

            const data = await res.json();
            if (res.ok) {
                setItems(prev => prev.map(item => item.key === key ? { ...item, isVisible: nextState } : item));
                setMessage({
                    type: "success",
                    text: nextState
                        ? (locale === 'ar' ? "تم إظهار الصفحة لجميع المستخدمين بنجاح! 🟢" : "Page is now visible to all users!")
                        : (locale === 'ar' ? "تم إخفاء الصفحة عن المستخدمين العاديين بنجاح! 🔴" : "Page is now hidden from normal users!")
                });
            } else {
                setMessage({ type: "error", text: data.error || "Failed to update" });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: "error", text: "Network error" });
        } finally {
            setActionLoading(null);
        }
    };

    // Sync / Discover pages
    const handleSyncPages = async () => {
        setSyncing(true);
        setMessage(null);
        try {
            const res = await fetch("/api/admin/nav-settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "SYNC_PAGES" })
            });

            const data = await res.json();
            if (res.ok) {
                if (Array.isArray(data.items)) {
                    setItems(data.items);
                }
                setMessage({
                    type: "success",
                    text: locale === 'ar' ? `تم تحديث وقراءة صفحات الموقع واكتشاف ${data.count} صفحات! 🔄` : "Navigation pages synchronized!"
                });
            } else {
                setMessage({ type: "error", text: data.error || "Sync failed" });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: "error", text: "Network error" });
        } finally {
            setSyncing(false);
        }
    };

    const getPageIcon = (key: string) => {
        switch (key) {
            case "dashboard": return <LayoutDashboard size={20} className="text-blue-500" />;
            case "ai_post_reply": return <Bot size={20} className="text-purple-500" />;
            case "ai_page_reply": return <Sparkles size={20} className="text-purple-500" />;
            case "auto_reply": return <MessageCircleReply size={20} className="text-pink-500" />;
            case "page_auto_reply": return <MessageSquareShare size={20} className="text-indigo-500" />;
            case "facebook_pages": return <Flag size={20} className="text-cyan-500" />;
            default: return <Compass size={20} className="text-slate-500" />;
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Eye className="w-8 h-8 text-indigo-500" />
                        {locale === 'ar' ? "إدارة ظهور صفحات الموقع (القائمة الرئيسية)" : "Navigation Pages Visibility Manager"}
                    </h2>
                    <p className="dark:text-slate-400 text-slate-500 text-sm mt-1">
                        {locale === 'ar'
                            ? "التحكم في إظهار أو إخفاء أي صفحة من صفحات الموقع عن المستخدمين، مع إمكانية قراءة الصفحات الجديدة وتحديثها."
                            : "Control which site pages are visible or hidden for normal users."}
                    </p>
                </div>

                <button
                    onClick={handleSyncPages}
                    disabled={syncing}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 self-start sm:self-auto text-sm active:scale-95"
                >
                    <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                    {locale === 'ar' ? "تحديث صفحات القائمة 🔄" : "Sync & Discover Pages"}
                </button>
            </div>

            {/* Notification Message */}
            {message && (
                <div className={`p-4 rounded-xl text-sm font-medium border flex items-center gap-2 animate-in fade-in duration-200 ${message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'}`}>
                    {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Info Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#2A303C] flex items-start gap-3">
                <Compass className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {locale === 'ar'
                        ? "أي صفحة تضعها في حالة (مخفية) ستختفي فوراً من القائمة الجانبية للمستخدمين العاديين، ولكنها تظل متاحة لك كـ أدمن دائماً. عند إضافة أي صفحة جديدة مستقبلاً في الكود، اضغط على زر 'تحديث صفحات القائمة' ليتم إدراجها هنا فوراً وحجز مكان لها في الإعدادات."
                        : "Hidden pages are immediately removed from normal users navigation. Admins always have access."}
                </p>
            </div>

            {/* Grid of Navigation Items */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(item => {
                        const isVisible = item.isVisible !== false;
                        const isLoading = actionLoading === item.key;

                        return (
                            <div
                                key={item.key}
                                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-sm ${isVisible ? 'dark:bg-[#151921] bg-white border-slate-200 dark:border-[#2A303C]' : 'dark:bg-[#10141C] bg-slate-100/70 border-slate-200 dark:border-slate-800/80 opacity-90'}`}
                            >
                                <div className="space-y-3">
                                    {/* Icon & Status Badge */}
                                    <div className="flex items-center justify-between">
                                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                                            {getPageIcon(item.key)}
                                        </div>

                                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${isVisible ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${isVisible ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            {isVisible ? (locale === 'ar' ? "ظاهرة للجميع" : "Visible") : (locale === 'ar' ? "مخفية عن الزوار" : "Hidden")}
                                        </span>
                                    </div>

                                    {/* Titles */}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-base dark:text-white text-slate-900">
                                                {locale === 'ar' ? item.nameAr : item.nameEn}
                                            </h3>
                                            {item.badge && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/30">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 font-mono mt-0.5" dir="ltr">{item.href}</p>
                                    </div>
                                </div>

                                {/* Toggle Action Button */}
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                                    <a
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
                                    >
                                        <ExternalLink size={12} />
                                        <span>{locale === 'ar' ? "معاينة الصفحة" : "Preview"}</span>
                                    </a>

                                    <button
                                        type="button"
                                        onClick={() => togglePageVisibility(item.key, isVisible)}
                                        disabled={isLoading}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${isVisible ? 'bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-500/20' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'}`}
                                    >
                                        {isLoading ? (
                                            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        ) : isVisible ? (
                                            <EyeOff size={14} />
                                        ) : (
                                            <Eye size={14} />
                                        )}
                                        <span>
                                            {isVisible ? (locale === 'ar' ? "إخفاء الصفحة" : "Hide Page") : (locale === 'ar' ? "إظهار الصفحة" : "Show Page")}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
