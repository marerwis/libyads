"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";
import {
    LayoutDashboard,
    Wallet,
    Flag,
    Megaphone,
    PlusCircle,
    Settings,
    CreditCard,
    Users,
    MonitorCog,
    ActivitySquare,
    Menu,
    X
} from "lucide-react";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { t, locale } = useLanguage();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const isActive = (path: string) => pathname === path;

    const navItems = [
        { name: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
        { name: t("wallet"), href: "/dashboard/wallet", icon: Wallet },
        { name: t("facebookPages"), href: "/dashboard/facebook", icon: Flag },
        { name: t("campaignHistory"), href: "/dashboard/campaigns", icon: Megaphone },
        { name: t("createPromotion"), href: "/dashboard/campaigns/create", icon: PlusCircle, isPrimary: true },
    ];

    const adminItems = [
        { name: t("settings"), href: "/dashboard/settings", icon: Settings },
        { name: t("paymentMethods"), href: "/dashboard/admin/payment-methods", icon: CreditCard },
        { name: t("usersManagement"), href: "/dashboard/admin/users", icon: Users },
        { name: t("metaConfig"), href: "/dashboard/admin/meta-settings", icon: MonitorCog },
    ];

    const sidebarTransform = isMobileMenuOpen
        ? 'translate-x-0'
        : (locale === 'ar' ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0');

    const sidebarPosition = locale === 'ar' ? 'right-0' : 'left-0';

    return (
        <div className="flex h-screen overflow-hidden bg-[#0a0a0b] text-slate-200 font-sans antialiased selection:bg-[#1877F2]/30">

            {/* Mobile Top Bar */}
            <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800/60 bg-[#0a0a0b] z-40 fixed top-0 left-0 right-0 h-16">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-[#1877F2] text-white">
                        <ActivitySquare size={18} strokeWidth={2.5} />
                    </div>
                    <h1 className="font-bold text-sm tracking-tight text-slate-100" dir="ltr">Meta Manager</h1>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/80 z-40 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed md:static inset-y-0 ${sidebarPosition} z-50 w-64 flex-shrink-0 flex flex-col justify-between bg-[#0a0a0b] border-x border-slate-800/60 transition-transform duration-300 ease-in-out transform ${sidebarTransform}`}>
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {/* Logo Section */}
                    <div className="h-16 md:h-20 flex items-center justify-between px-6 border-b border-slate-800/60">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-[#1877F2] text-white shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
                                <ActivitySquare size={18} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="font-bold text-sm tracking-tight text-slate-100 group-hover:text-blue-400 transition-colors" dir="ltr">Meta Manager</h1>
                                <p className="text-[10px] uppercase font-medium tracking-wider text-slate-500 mt-0.5" dir="ltr">Centralized Account</p>
                            </div>
                        </Link>
                        <button className="md:hidden text-slate-400 p-2 -mr-2 hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Main Navigation */}
                    <nav className="mt-6 px-3 space-y-1">
                        <div className={`px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                            {t("mainMenu")}
                        </div>
                        {navItems.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 relative group
                                        ${active
                                            ? item.isPrimary
                                                ? "bg-blue-600/10 text-blue-500"
                                                : "bg-slate-800/50 text-slate-100"
                                            : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
                                        }
                                        ${item.isPrimary && !active ? "text-blue-500 hover:bg-blue-600/10 hover:text-blue-400" : ""}
                                    `}
                                >
                                    {active && !item.isPrimary && (
                                        <div className={`absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-slate-300 ${locale === 'ar' ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'}`} />
                                    )}
                                    {active && item.isPrimary && (
                                        <div className={`absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 ${locale === 'ar' ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'}`} />
                                    )}
                                    <item.icon size={18} className={`${active ? (item.isPrimary ? "text-blue-500" : "text-slate-200") : "text-slate-500 group-hover:text-slate-300"} ${item.isPrimary && !active ? "text-blue-500 group-hover:text-blue-400" : ""}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Admin Navigation */}
                    <div className="mt-8 px-3 space-y-1 pb-4">
                        <div className={`px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                            {t("administration") || "Administration"}
                        </div>
                        {adminItems.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 relative group
                                        ${active
                                            ? "bg-amber-500/10 text-amber-500"
                                            : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
                                        }
                                    `}
                                >
                                    {active && (
                                        <div className={`absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-amber-500 ${locale === 'ar' ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'}`} />
                                    )}
                                    <item.icon size={18} className={active ? "text-amber-500" : "text-slate-500 group-hover:text-slate-300"} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Footer / Profile */}
                <div className="p-4 border-t border-slate-800/60 bg-slate-900/20 flex flex-col gap-4">
                    <LanguageSwitcher />
                    <LogoutButton />
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-[#0a0a0b] relative pt-16 md:pt-0 w-full">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none mt-16 md:mt-0" />
                <div className="p-4 md:p-8 relative z-10 m-3 md:m-4 bg-[#0e0e11] rounded-2xl border border-slate-800/60 shadow-xl min-h-[calc(100vh-5.5rem)] md:min-h-[calc(100vh-2rem)] overflow-x-hidden">
                    {children}
                </div>
            </main>
        </div>
    );
}
