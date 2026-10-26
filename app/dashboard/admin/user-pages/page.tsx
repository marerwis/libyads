"use client"

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { ShieldCheck, Users, Search, CheckSquare, Square, Save, RefreshCw, AlertCircle, CheckCircle2, Flag, ToggleLeft, ToggleRight, Sparkles, Filter } from "lucide-react";

export default function UserPagesPermissionManager() {
    const { t, locale } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

    // Data from API
    const [restrictPagesByUser, setRestrictPagesByUser] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [allPages, setAllPages] = useState<any[]>([]);

    // Search & Filter
    const [userSearch, setUserSearch] = useState("");
    const [pageSearch, setPageSearch] = useState("");

    // Selected user for editing
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);

    useEffect(() => {
        fetchPermissions();
    }, []);

    const fetchPermissions = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/user-permissions");
            const data = await res.json();

            if (res.ok) {
                setRestrictPagesByUser(Boolean(data.restrictPagesByUser));
                setUsers(data.users || []);
                setAllPages(data.allPages || []);

                // Select first user by default if available and none selected
                if (data.users && data.users.length > 0 && !selectedUserId) {
                    setSelectedUserId(data.users[0].id);
                    setSelectedPageIds(data.users[0].allowedPageIds || []);
                }
            } else {
                setMessage({ type: "error", text: data.error || "Failed to load permissions" });
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setMessage({ type: "error", text: locale === 'ar' ? "فشل الاتصال بالسيرفر" : "Server connection failed" });
        } finally {
            setLoading(false);
        }
    };

    // When switching user
    const handleSelectUser = (user: any) => {
        setSelectedUserId(user.id);
        setSelectedPageIds(user.allowedPageIds || []);
        setMessage(null);
    };

    // Toggle global restriction
    const handleToggleRestriction = async () => {
        setToggling(true);
        setMessage(null);
        try {
            const nextState = !restrictPagesByUser;
            const res = await fetch("/api/admin/user-permissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "TOGGLE_RESTRICTION",
                    enabled: nextState
                })
            });

            const data = await res.json();
            if (res.ok) {
                setRestrictPagesByUser(nextState);
                setMessage({
                    type: "success",
                    text: nextState
                        ? (locale === 'ar' ? "تم تفعيل نظام تقييد الصفحات بنجاح! 🔒" : "Page restriction system activated!")
                        : (locale === 'ar' ? "تم إلغاء تقييد الصفحات، النظام مفتوح حالياً 🔓" : "Page restriction system deactivated!")
                });
            } else {
                setMessage({ type: "error", text: data.error || "Failed to update" });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: "error", text: "Network error" });
        } finally {
            setToggling(false);
        }
    };

    // Toggle single page selection
    const handleTogglePage = (pageId: string) => {
        setSelectedPageIds(prev =>
            prev.includes(pageId) ? prev.filter(id => id !== pageId) : [...prev, pageId]
        );
    };

    // Select All / Deselect All
    const handleSelectAllPages = () => {
        setSelectedPageIds(allPages.map(p => p.pageId));
    };

    const handleDeselectAllPages = () => {
        setSelectedPageIds([]);
    };

    // Save user pages
    const handleSaveUserPermissions = async () => {
        if (!selectedUserId) return;
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch("/api/admin/user-permissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "SET_USER_PAGES",
                    targetUserId: selectedUserId,
                    allowedPageIds: selectedPageIds
                })
            });

            const data = await res.json();
            if (res.ok) {
                // Update local users state
                setUsers(prev => prev.map(u =>
                    u.id === selectedUserId ? { ...u, allowedPageIds: selectedPageIds } : u
                ));

                setMessage({
                    type: "success",
                    text: locale === 'ar' ? "تم حفظ صلاحيات الصفحات لهذا المستخدم بنجاح! ✅" : "Permissions saved successfully!"
                });
            } else {
                setMessage({ type: "error", text: data.error || "Failed to save" });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: "error", text: "Network error" });
        } finally {
            setSaving(false);
        }
    };

    const selectedUser = users.find(u => u.id === selectedUserId);
    const filteredUsers = users.filter(u =>
        (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(userSearch.toLowerCase())
    );
    const filteredPages = allPages.filter(p =>
        (p.pageName || "").toLowerCase().includes(pageSearch.toLowerCase()) ||
        (p.pageId || "").includes(pageSearch)
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900 tracking-tight flex items-center gap-2.5">
                        <ShieldCheck className="w-8 h-8 text-amber-500" />
                        {locale === 'ar' ? "صلاحيات صفحات فيسبوك للمستخدمين" : "User Facebook Page Permissions"}
                    </h2>
                    <p className="dark:text-slate-400 text-slate-500 text-sm mt-1">
                        {locale === 'ar'
                            ? "تحديد الصفحات المصرح لكل مستخدم برؤيتها وإدارتها من حسابه، مع زر تفعيل مؤقت للنظام."
                            : "Assign specific Facebook pages to each user, with a temporary master restriction toggle."}
                    </p>
                </div>

                <button
                    onClick={fetchPermissions}
                    disabled={loading}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1E232F] dark:hover:bg-[#2A303C] text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-all flex items-center gap-2 self-start md:self-auto text-sm"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    {locale === 'ar' ? "تحديث البيانات" : "Refresh"}
                </button>
            </div>

            {/* Global Feature Toggle Banner */}
            <div className={`p-6 rounded-2xl border transition-all ${restrictPagesByUser ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30' : 'bg-slate-50 dark:bg-[#151921] border-slate-200 dark:border-[#2A303C]'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-base dark:text-white text-slate-900">
                                {locale === 'ar' ? "حالة نظام تقييد الصفحات (المؤقت):" : "Page Restriction Mode (Temporary):"}
                            </span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 ${restrictPagesByUser ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${restrictPagesByUser ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
                                {restrictPagesByUser ? (locale === 'ar' ? "مفعل ومطبق حالياً" : "Active & Restricting") : (locale === 'ar' ? "معطل (النظام مفتوح)" : "Disabled (Open Mode)")}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
                            {locale === 'ar'
                                ? "عند تفعيل هذا الخيار، لن تظهر لأي مستخدم عادي في الموقع إلا الصفحات المحددة له في هذا الجدول. عند تعطيله، يتم إيقاف التقييد. هذا النظام مؤقت لتفادي المشاكل ريثما يتم توثيق الحساب بالكامل في فيسبوك ديفيلوبر."
                                : "When active, normal users will strictly only see pages explicitly assigned to them below. Admins can always see all pages."}
                        </p>
                    </div>

                    <button
                        onClick={handleToggleRestriction}
                        disabled={toggling}
                        type="button"
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 self-start sm:self-auto shadow-sm active:scale-95 ${restrictPagesByUser ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                    >
                        {toggling ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : restrictPagesByUser ? (
                            <ToggleRight size={20} />
                        ) : (
                            <ToggleLeft size={20} />
                        )}
                        {restrictPagesByUser
                            ? (locale === 'ar' ? "إيقاف التقييد" : "Deactivate")
                            : (locale === 'ar' ? "تفعيل التقييد الآن" : "Activate Restriction")}
                    </button>
                </div>
            </div>

            {/* Notification Message */}
            {message && (
                <div className={`p-4 rounded-xl text-sm font-medium border flex items-center gap-2 animate-in fade-in duration-200 ${message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'}`}>
                    {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Main Content Grid: Users on Left, Pages on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Users Column (4 Cols) */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="dark:bg-[#151921] bg-white rounded-2xl border dark:border-[#2A303C] border-slate-200 p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm dark:text-white text-slate-900 flex items-center gap-2">
                                <Users size={18} className="text-indigo-500" />
                                {locale === 'ar' ? "المستخدمون المسجلون" : "Registered Users"}
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                                    {users.length}
                                </span>
                            </h3>
                        </div>

                        {/* Search Users */}
                        <div className="relative">
                            <Search className="w-4 h-4 absolute top-3 start-3 text-slate-400" />
                            <input
                                type="text"
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                placeholder={locale === 'ar' ? "بحث بالاسم أو الإيميل..." : "Search user..."}
                                className="w-full ps-9 pe-3 py-2 text-xs rounded-xl border dark:border-slate-800 border-slate-200 dark:bg-[#0B0E14] bg-slate-50 dark:text-white text-slate-900 focus:outline-none focus:border-amber-500"
                            />
                        </div>

                        {/* User List */}
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pe-1">
                            {filteredUsers.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-6">
                                    {locale === 'ar' ? "لا يوجد مستخدمون مطابقون" : "No matching users"}
                                </p>
                            ) : (
                                filteredUsers.map(user => {
                                    const isSelected = user.id === selectedUserId;
                                    const assignedCount = (user.allowedPageIds || []).length;
                                    const isAdmin = user.role === "ADMIN";

                                    return (
                                        <button
                                            key={user.id}
                                            onClick={() => handleSelectUser(user)}
                                            type="button"
                                            className={`w-full p-3 rounded-xl border text-start transition-all flex items-start justify-between gap-2 ${isSelected ? 'border-amber-500 bg-amber-500/10 shadow-sm' : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30'}`}
                                        >
                                            <div className="space-y-0.5 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-xs dark:text-white text-slate-900 truncate">
                                                        {user.name || (locale === 'ar' ? "مستخدم بدون اسم" : "Unnamed")}
                                                    </span>
                                                    {isAdmin && (
                                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20">
                                                            ADMIN
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                                            </div>

                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${assignedCount > 0 ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                {assignedCount} {locale === 'ar' ? "صفحات" : "pages"}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Pages Assignment Column (8 Cols) */}
                <div className="lg:col-span-8 space-y-4">
                    {selectedUser ? (
                        <div className="dark:bg-[#151921] bg-white rounded-2xl border dark:border-[#2A303C] border-slate-200 p-5 shadow-sm space-y-4">
                            {/* Selected User Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <h3 className="font-bold text-base dark:text-white text-slate-900 flex items-center gap-2">
                                        <Flag className="w-5 h-5 text-amber-500" />
                                        {locale === 'ar' ? "تخصيص الصفحات للمستخدم:" : "Assign Pages to:"}
                                        <span className="text-amber-600 dark:text-amber-400">{selectedUser.name || selectedUser.email}</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {locale === 'ar'
                                            ? `حدد الصفحات التي يستطيع هذا المستخدم الوصول إليها (محدد حالياً ${selectedPageIds.length} من أصل ${allPages.length} صفحة).`
                                            : `Select allowed pages for this user (${selectedPageIds.length} of ${allPages.length} selected).`}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSelectAllPages}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                                    >
                                        {locale === 'ar' ? "تحديد الكل" : "Select All"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeselectAllPages}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                                    >
                                        {locale === 'ar' ? "إلغاء التحديد" : "Deselect"}
                                    </button>
                                </div>
                            </div>

                            {/* Search Pages */}
                            <div className="relative">
                                <Search className="w-4 h-4 absolute top-3 start-3 text-slate-400" />
                                <input
                                    type="text"
                                    value={pageSearch}
                                    onChange={e => setPageSearch(e.target.value)}
                                    placeholder={locale === 'ar' ? "بحث بين الـ 25 صفحة..." : "Filter pages..."}
                                    className="w-full ps-9 pe-3 py-2 text-xs rounded-xl border dark:border-slate-800 border-slate-200 dark:bg-[#0B0E14] bg-slate-50 dark:text-white text-slate-900 focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            {/* Pages Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[480px] overflow-y-auto pe-1">
                                {filteredPages.map(page => {
                                    const isChecked = selectedPageIds.includes(page.pageId);

                                    return (
                                        <div
                                            key={page.pageId}
                                            onClick={() => handleTogglePage(page.pageId)}
                                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${isChecked ? 'border-amber-500/60 bg-amber-500/10 shadow-sm' : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-[#0B0E14]'}`}
                                        >
                                            <div className="space-y-0.5 min-w-0 flex-1">
                                                <h4 className="font-bold text-xs dark:text-white text-slate-900 truncate">
                                                    {page.pageName}
                                                </h4>
                                                <p className="text-[10px] font-mono text-slate-400 truncate">ID: {page.pageId}</p>
                                            </div>

                                            <div className="flex-shrink-0">
                                                {isChecked ? (
                                                    <div className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center shadow-sm">
                                                        <CheckSquare size={14} />
                                                    </div>
                                                ) : (
                                                    <div className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-center text-transparent">
                                                        <Square size={14} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Save Button Bar */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-xs text-slate-500">
                                    {locale === 'ar' ? `المحدد: ${selectedPageIds.length} صفحة` : `Selected: ${selectedPageIds.length}`}
                                </span>

                                <button
                                    onClick={handleSaveUserPermissions}
                                    disabled={saving}
                                    type="button"
                                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 active:scale-95 text-sm"
                                >
                                    {saving ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Save size={16} />
                                    )}
                                    {locale === 'ar' ? "حفظ صلاحيات الصفحات لهذا المستخدم" : "Save Permissions"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="dark:bg-[#151921] bg-white rounded-2xl border dark:border-[#2A303C] border-slate-200 p-12 text-center text-slate-400">
                            <Users size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">{locale === 'ar' ? "يرجى اختيار مستخدم من القائمة لتحديد صفحاته" : "Please select a user to manage pages"}</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
