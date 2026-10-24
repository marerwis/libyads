"use client"

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
    Facebook, LogIn, Flag, RefreshCw, Search,
    ChevronLeft, ChevronRight, Zap, Link2Off,
    Grid3X3, List, Loader2, CheckCircle2, XCircle
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

const ITEMS_PER_PAGE = 12;

function FacebookPagesContent() {
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "error" | "success", text: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const [currentPage, setCurrentPage] = useState(1);

    const searchParams = useSearchParams();
    const { t, locale } = useLanguage();
    const isRtl = locale === "ar";

    useEffect(() => {
        const error = searchParams.get("error");
        const success = searchParams.get("success");
        if (error) setMessage({ type: "error", text: isRtl ? "فشل الاتصال: " + error : "Connection failed: " + error });
        else if (success) setMessage({ type: "success", text: isRtl ? "تم ربط صفحات فيسبوك بنجاح!" : "Facebook Pages connected successfully!" });
        if (error || success) window.history.replaceState(null, "", window.location.pathname);
        fetchPages();
    }, [searchParams]);

    const fetchPages = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/facebook/pages");
            const data = await res.json();
            if (Array.isArray(data)) setPages(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleConnect = async () => {
        setConnecting(true);
        try {
            const res = await fetch("/api/facebook/auth");
            const data = await res.json();
            if (data.url) window.location.href = data.url;
            else setMessage({ type: "error", text: data.error || "Failed" });
        } catch { setMessage({ type: "error", text: "Error" }); }
        finally { setConnecting(false); }
    };

    const handleSync = async () => {
        setSyncing(true);
        setMessage(null);
        try {
            const res = await fetch("/api/facebook/pages/sync", { method: "POST" });
            const data = await res.json();
            if (res.ok && data.success) {
                setMessage({ type: "success", text: isRtl ? "تمت المزامنة!" : "Synced!" });
                fetchPages();
            } else setMessage({ type: "error", text: data.error || "Failed" });
        } catch { setMessage({ type: "error", text: "Error" }); }
        finally { setSyncing(false); }
    };

    const handleToggle = async (page: any) => {
        setTogglingId(page.id);
        const newState = !page.isAutoReplyActive;
        try {
            const res = await fetch("/api/facebook/pages/" + page.id + "/toggle", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isAutoReplyActive: newState })
            });
            if (res.ok) {
                setPages(prev => prev.map(p => p.id === page.id ? { ...p, isAutoReplyActive: newState } : p));
                setMessage({
                    type: "success",
                    text: isRtl
                        ? (newState ? "تم تفعيل الرد التلقائي لـ " : "تم إيقاف الرد التلقائي لـ ") + page.pageName
                        : "Auto-reply " + (newState ? "enabled" : "disabled") + " for " + page.pageName
                });
                setTimeout(() => setMessage(null), 3000);
            }
        } catch { setMessage({ type: "error", text: "Toggle failed" }); }
        finally { setTogglingId(null); }
    };

    const handleDisconnect = async () => {
        if (!confirm(isRtl ? "فك ارتباط كل الصفحات؟" : "Disconnect all pages?")) return;
        try {
            await fetch("/api/facebook/disconnect", { method: "DELETE" });
            setPages([]);
        } catch { setMessage({ type: "error", text: "Error" }); }
    };

    const filtered = useMemo(() => pages.filter(p => {
        const matchSearch = !searchQuery || p.pageName?.toLowerCase().includes(searchQuery.toLowerCase()) || p.pageId?.includes(searchQuery);
        const matchFilter = filterStatus === "all" || (filterStatus === "active" && p.isAutoReplyActive) || (filterStatus === "inactive" && !p.isAutoReplyActive);
        return matchSearch && matchFilter;
    }), [pages, searchQuery, filterStatus]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const activeCount = pages.filter(p => p.isAutoReplyActive).length;

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-[#1877F2] border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">{isRtl ? "جاري التحميل..." : "Loading..."}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-5" dir={isRtl ? "rtl" : "ltr"}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white text-slate-900 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-[#1877F2]/10 flex items-center justify-center">
                            <Facebook size={22} className="text-[#1877F2]" />
                        </span>
                        {isRtl ? "صفحات فيسبوك" : "Facebook Pages"}
                    </h2>
                    <p className="dark:text-slate-400 text-slate-500 text-sm mt-1 ms-[52px]">
                        {pages.length > 0 ? (isRtl ? pages.length + " صفحة · " + activeCount + " مفعّلة" : pages.length + " pages · " + activeCount + " active") : (isRtl ? "لا توجد صفحات مرتبطة" : "No pages connected")}
                    </p>
                </div>
                <div className="flex gap-2">
                    {pages.length > 0 && (
                        <button onClick={handleSync} disabled={syncing || connecting}
                            className="flex items-center gap-2 px-4 py-2.5 dark:bg-[#151921] bg-white border dark:border-[#2A303C] border-slate-200 dark:text-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:border-[#1877F2]/40 transition-all disabled:opacity-50 shadow-sm">
                            {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                            {isRtl ? "مزامنة" : "Sync"}
                        </button>
                    )}
                    <button onClick={handleConnect} disabled={connecting || syncing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#1877F2] hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25">
                        {connecting ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
                        {isRtl ? (pages.length > 0 ? "تجديد" : "ربط") : (pages.length > 0 ? "Refresh" : "Connect")}
                    </button>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={"flex items-center gap-3 p-4 rounded-xl text-sm font-medium border " + (message.type === "error"
                    ? "dark:bg-red-900/20 bg-red-50 dark:text-red-400 text-red-600 dark:border-red-900/40 border-red-200"
                    : "dark:bg-emerald-900/20 bg-emerald-50 dark:text-emerald-400 text-emerald-600 dark:border-emerald-900/40 border-emerald-200")}>
                    {message.type === "error" ? <XCircle size={17} /> : <CheckCircle2 size={17} />}
                    {message.text}
                </div>
            )}

            {pages.length === 0 ? (
                <div className="dark:bg-[#151921] bg-white rounded-2xl border dark:border-[#2A303C] border-slate-200 p-16 flex flex-col items-center text-center shadow-sm">
                    <div className="w-20 h-20 rounded-2xl bg-[#1877F2]/10 flex items-center justify-center mb-6">
                        <Facebook size={40} className="text-[#1877F2]" />
                    </div>
                    <h3 className="text-xl font-semibold dark:text-white text-slate-900 mb-2">{isRtl ? "لم يتم ربط أي صفحة" : "No Pages Connected"}</h3>
                    <p className="dark:text-slate-400 text-slate-500 text-sm mb-8 max-w-sm">{isRtl ? "اضغط زر الربط للاتصال بفيسبوك وجلب صفحاتك" : "Connect your Facebook account to load your pages"}</p>
                    <button onClick={handleConnect} disabled={connecting} className="flex items-center gap-2 px-8 py-3 bg-[#1877F2] hover:bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all">
                        {connecting ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                        {isRtl ? "ربط فيسبوك" : "Connect Facebook"}
                    </button>
                </div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: isRtl ? "إجمالي" : "Total", value: pages.length, cls: "text-[#1877F2]" },
                            { label: isRtl ? "مفعّل" : "Active", value: activeCount, cls: "text-emerald-500" },
                            { label: isRtl ? "موقوف" : "Inactive", value: pages.length - activeCount, cls: "dark:text-slate-300 text-slate-600" },
                        ].map((s, i) => (
                            <div key={i} className="dark:bg-[#151921] bg-white rounded-xl border dark:border-[#2A303C] border-slate-200 p-4 shadow-sm text-center">
                                <p className="dark:text-slate-400 text-slate-500 text-xs mb-1">{s.label}</p>
                                <p className={"text-2xl font-bold " + s.cls}>{s.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Search & Filter */}
                    <div className="dark:bg-[#151921] bg-white rounded-xl border dark:border-[#2A303C] border-slate-200 p-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 dark:text-slate-500 text-slate-400" />
                                <input type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    placeholder={isRtl ? "ابحث باسم الصفحة أو ID..." : "Search by name or ID..."}
                                    className="w-full ps-9 pe-4 py-2.5 dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-lg text-sm dark:text-white text-slate-900 focus:outline-none focus:border-[#1877F2] transition-colors" />
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {[{ k: "all", ar: "الكل", en: "All" }, { k: "active", ar: "مفعّل", en: "Active" }, { k: "inactive", ar: "موقوف", en: "Off" }].map(f => (
                                    <button key={f.k} onClick={() => { setFilterStatus(f.k as any); setCurrentPage(1); }}
                                        className={"px-3 py-2 rounded-lg text-sm font-medium transition-all " + (filterStatus === f.k ? "bg-[#1877F2] text-white" : "dark:bg-[#0B0E14] bg-slate-50 dark:text-slate-400 text-slate-600 border dark:border-[#2A303C] border-slate-200 hover:border-[#1877F2]/40")}>
                                        {isRtl ? f.ar : f.en}
                                    </button>
                                ))}
                                <div className="flex dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-lg overflow-hidden">
                                    {[{ m: "list", Icon: List }, { m: "grid", Icon: Grid3X3 }].map(({ m, Icon }) => (
                                        <button key={m} onClick={() => setViewMode(m as any)}
                                            className={"p-2.5 transition-colors " + (viewMode === m ? "bg-[#1877F2] text-white" : "dark:text-slate-400 text-slate-500")}>
                                            <Icon size={15} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {searchQuery && <p className="dark:text-slate-500 text-slate-400 text-xs mt-2">{filtered.length} {isRtl ? "نتيجة" : "result(s)"}</p>}
                    </div>

                    {/* Pages */}
                    {filtered.length === 0 ? (
                        <div className="dark:bg-[#151921] bg-white rounded-xl border dark:border-[#2A303C] border-slate-200 p-12 text-center shadow-sm">
                            <p className="dark:text-slate-400 text-slate-500">{isRtl ? "لا توجد نتائج" : "No results"}</p>
                        </div>
                    ) : viewMode === "list" ? (
                        <div className="dark:bg-[#151921] bg-white rounded-xl border dark:border-[#2A303C] border-slate-200 overflow-hidden shadow-sm">
                            {paginated.map((page, idx) => (
                                <div key={page.id} className={"flex items-center justify-between p-5 gap-4 dark:hover:bg-[#0B0E14]/60 hover:bg-slate-50 transition-colors " + (idx < paginated.length - 1 ? "border-b dark:border-[#2A303C] border-slate-100" : "")}>
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <div className="w-12 h-12 rounded-xl bg-[#1877F2]/10 flex items-center justify-center flex-shrink-0">
                                            <Flag size={20} className="text-[#1877F2]" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="dark:text-white text-slate-900 font-semibold truncate">{page.pageName}</h4>
                                            <p className="dark:text-slate-500 text-slate-400 text-xs mt-0.5 font-mono">ID: {page.pageId}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className={"hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium " + (page.isAutoReplyActive ? "dark:bg-emerald-900/30 bg-emerald-50 dark:text-emerald-400 text-emerald-600" : "dark:bg-slate-800 bg-slate-100 dark:text-slate-500 text-slate-500")}>
                                            <span className={"w-1.5 h-1.5 rounded-full " + (page.isAutoReplyActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                                            {page.isAutoReplyActive ? (isRtl ? "مفعّل" : "Active") : (isRtl ? "موقوف" : "Off")}
                                        </span>
                                        <button onClick={() => handleToggle(page)} disabled={togglingId === page.id}
                                            className={"relative w-14 h-7 rounded-full transition-all duration-300 flex-shrink-0 " + (page.isAutoReplyActive ? "bg-emerald-500" : "dark:bg-slate-700 bg-slate-200")}>
                                            <span className={"absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center " + (page.isAutoReplyActive ? (isRtl ? "right-0.5" : "left-7") : (isRtl ? "right-7" : "left-0.5"))}>
                                                {togglingId === page.id ? <Loader2 size={11} className="animate-spin text-slate-400" /> : <Zap size={10} className={page.isAutoReplyActive ? "text-emerald-500" : "text-slate-400"} />}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {paginated.map(page => (
                                <div key={page.id} className="dark:bg-[#151921] bg-white rounded-xl border dark:border-[#2A303C] border-slate-200 p-5 shadow-sm hover:shadow-md dark:hover:border-[#1877F2]/30 hover:border-[#1877F2]/30 transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-[#1877F2]/10 flex items-center justify-center">
                                            <Flag size={20} className="text-[#1877F2]" />
                                        </div>
                                        <span className={"px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 " + (page.isAutoReplyActive ? "dark:bg-emerald-900/30 bg-emerald-50 dark:text-emerald-400 text-emerald-600" : "dark:bg-slate-800 bg-slate-100 dark:text-slate-500 text-slate-400")}>
                                            <span className={"w-1.5 h-1.5 rounded-full " + (page.isAutoReplyActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                                            {page.isAutoReplyActive ? (isRtl ? "مفعّل" : "On") : (isRtl ? "موقوف" : "Off")}
                                        </span>
                                    </div>
                                    <h4 className="dark:text-white text-slate-900 font-semibold mb-1 truncate">{page.pageName}</h4>
                                    <p className="dark:text-slate-500 text-slate-400 text-xs font-mono mb-4 truncate">ID: {page.pageId}</p>
                                    <button onClick={() => handleToggle(page)} disabled={togglingId === page.id}
                                        className={"w-full py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 border " + (page.isAutoReplyActive ? "dark:bg-red-900/20 bg-red-50 dark:text-red-400 text-red-600 dark:border-red-900/40 border-red-200" : "dark:bg-emerald-900/20 bg-emerald-50 dark:text-emerald-400 text-emerald-600 dark:border-emerald-900/40 border-emerald-200")}>
                                        {togglingId === page.id ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                        {page.isAutoReplyActive ? (isRtl ? "إيقاف الرد" : "Disable") : (isRtl ? "تفعيل الرد" : "Enable")}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between dark:bg-[#151921] bg-white rounded-xl border dark:border-[#2A303C] border-slate-200 p-4 shadow-sm">
                            <p className="dark:text-slate-400 text-slate-500 text-sm">
                                {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} {isRtl ? "من" : "of"} {filtered.length}
                            </p>
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                    className="w-9 h-9 rounded-lg flex items-center justify-center dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 dark:text-slate-400 text-slate-600 disabled:opacity-40 hover:border-[#1877F2]/40 transition-colors">
                                    {isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                                </button>
                                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                    let pg = i + 1;
                                    if (totalPages > 7) {
                                        if (currentPage <= 4) pg = i + 1;
                                        else if (currentPage >= totalPages - 3) pg = totalPages - 6 + i;
                                        else pg = currentPage - 3 + i;
                                    }
                                    return (
                                        <button key={pg} onClick={() => setCurrentPage(pg)}
                                            className={"w-9 h-9 rounded-lg text-sm font-medium transition-all " + (currentPage === pg ? "bg-[#1877F2] text-white shadow-lg shadow-blue-500/20" : "dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 dark:text-slate-400 text-slate-600 hover:border-[#1877F2]/40")}>
                                            {pg}
                                        </button>
                                    );
                                })}
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                    className="w-9 h-9 rounded-lg flex items-center justify-center dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 dark:text-slate-400 text-slate-600 disabled:opacity-40 hover:border-[#1877F2]/40 transition-colors">
                                    {isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button onClick={handleDisconnect} className="flex items-center gap-2 px-4 py-2 text-sm dark:text-slate-500 text-slate-400 hover:text-red-500 transition-colors">
                            <Link2Off size={14} />
                            {isRtl ? "فك ارتباط كل الصفحات" : "Disconnect all"}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default function FacebookPages() {
    return (
        <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
            <FacebookPagesContent />
        </Suspense>
    );
}