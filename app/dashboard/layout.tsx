import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-[#0B0E14] text-slate-200 font-sans antialiased">
            <aside className="w-64 flex-shrink-0 flex flex-col justify-between bg-[#0B0E14] border-r border-[#2A303C] transition-colors duration-200">
                <div>
                    <div className="h-20 flex items-center px-6 border-b border-transparent">
                        <Link href="/" className="flex items-center gap-3 group">
                            <span className="material-symbols-outlined text-[#1877F2] text-3xl group-hover:scale-105 transition-transform">all_inclusive</span>
                            <div>
                                <h1 className="font-bold text-sm leading-tight text-white group-hover:text-[#1877F2] transition-colors">Meta Manager</h1>
                                <p className="text-xs text-slate-400">Centralized Ad Account</p>
                            </div>
                        </Link>
                    </div>
                    <nav className="mt-6 px-4 space-y-1">
                        <Link
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg bg-[#151921] text-white transition-colors"
                            href="/dashboard"
                        >
                            <span className="material-symbols-outlined text-[#1877F2]">dashboard</span>
                            Dashboard
                        </Link>
                        <Link
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-slate-400 hover:bg-[#151921] hover:text-white transition-colors"
                            href="/dashboard/wallet"
                        >
                            <span className="material-symbols-outlined">account_balance_wallet</span>
                            Wallet
                        </Link>
                        <Link
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-slate-400 hover:bg-[#151921] hover:text-white transition-colors"
                            href="/dashboard/facebook"
                        >
                            <span className="material-symbols-outlined">flag</span>
                            Facebook Pages
                        </Link>
                        <Link
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-slate-400 hover:bg-[#151921] hover:text-white transition-colors"
                            href="/dashboard/campaigns"
                        >
                            <span className="material-symbols-outlined">campaign</span>
                            Campaigns
                        </Link>
                        <Link
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-slate-400 hover:bg-[#151921] hover:text-white transition-colors"
                            href="/dashboard/campaigns"
                        >
                            <span className="material-symbols-outlined text-[#1877F2]">add_circle</span>
                            Create Promotion
                        </Link>
                    </nav>
                    <div className="mt-8 px-4">
                        <Link
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-slate-400 hover:bg-[#151921] hover:text-white transition-colors"
                            href="/dashboard/settings"
                        >
                            <span className="material-symbols-outlined">settings</span>
                            Settings
                        </Link>
                        <Link
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-amber-500/70 hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                            href="/dashboard/admin/payment-methods"
                        >
                            <span className="material-symbols-outlined">payments</span>
                            Payment Methods (Admin)
                        </Link>
                        <Link
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-amber-500/70 hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                            href="/dashboard/admin/users"
                        >
                            <span className="material-symbols-outlined">group</span>
                            Users Management (Admin)
                        </Link>
                        <Link
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-amber-500/70 hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                            href="/dashboard/admin/meta-settings"
                        >
                            <span className="material-symbols-outlined">admin_panel_settings</span>
                            Meta Config (Admin)
                        </Link>
                    </div>
                </div>
                <div className="p-4 border-t border-transparent">
                    <LogoutButton />
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto bg-[#0B0E14] p-8 transition-colors duration-200">
                {children}
            </main>
        </div>
    );
}
