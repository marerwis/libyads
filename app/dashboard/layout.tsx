"use client";

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
    ActivitySquare
} from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
        { name: "Facebook Pages", href: "/dashboard/facebook", icon: Flag },
        { name: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
        { name: "Create Promotion", href: "/dashboard/campaigns", icon: PlusCircle, isPrimary: true },
    ];

    const adminItems = [
        { name: "Settings", href: "/dashboard/settings", icon: Settings },
        { name: "Payment Methods", href: "/dashboard/admin/payment-methods", icon: CreditCard },
        { name: "Users Management", href: "/dashboard/admin/users", icon: Users },
        { name: "Meta Config", href: "/dashboard/admin/meta-settings", icon: MonitorCog },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-[#0a0a0b] text-slate-200 font-sans antialiased selection:bg-[#1877F2]/30">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 flex flex-col justify-between bg-[#0a0a0b] border-r border-slate-800/60 transition-colors duration-300">
                <div>
                    {/* Logo Section */}
                    <div className="h-20 flex items-center px-6 border-b border-slate-800/60">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-[#1877F2] text-white shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
                                <ActivitySquare size={18} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="font-bold text-sm tracking-tight text-slate-100 group-hover:text-blue-400 transition-colors">Meta Manager</h1>
                                <p className="text-[10px] uppercase font-medium tracking-wider text-slate-500 mt-0.5">Centralized Account</p>
                            </div>
                        </Link>
                    </div>

                    {/* Main Navigation */}
                    <nav className="mt-6 px-3 space-y-1">
                        <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Main Menu
                        </div>
                        {navItems.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.name}
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
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-slate-300 rounded-r-full" />
                                    )}
                                    {active && item.isPrimary && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full" />
                                    )}
                                    <item.icon size={18} className={`${active ? (item.isPrimary ? "text-blue-500" : "text-slate-200") : "text-slate-500 group-hover:text-slate-300"} ${item.isPrimary && !active ? "text-blue-500 group-hover:text-blue-400" : ""}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Admin Navigation */}
                    <div className="mt-8 px-3 space-y-1">
                        <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Administration
                        </div>
                        {adminItems.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 relative group
                                        ${active
                                            ? "bg-amber-500/10 text-amber-500"
                                            : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
                                        }
                                    `}
                                >
                                    {active && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-amber-500 rounded-r-full" />
                                    )}
                                    <item.icon size={18} className={active ? "text-amber-500" : "text-slate-500 group-hover:text-slate-300"} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Footer / Profile */}
                <div className="p-4 border-t border-slate-800/60 bg-slate-900/20">
                    <LogoutButton />
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-[#0a0a0b] relative">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none" />
                <div className="p-8 relative z-10 m-4 bg-[#0e0e11] rounded-2xl border border-slate-800/60 shadow-xl min-h-[calc(100vh-2rem)]">
                    {children}
                </div>
            </main>
        </div>
    );
}
