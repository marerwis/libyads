import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import PerformanceChart from "./PerformanceChart"

export default async function Dashboard() {
    const session = await getServerSession()

    if (!session?.user?.email) {
        redirect("/login")
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    })

    // Fetch dashboard stats from our API internally
    const statsRes = await fetch(`${process.env.NEXTAUTH_URL}/api/dashboard/stats`, {
        headers: {
            "Cookie": `next-auth.session-token=${session?.user?.id}` // Or you can just fetch directly from prisma since this is an async Server Component
        }
    });

    // We can also fetch directly from Prisma in a Server Component for better performance
    const stats = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            wallet: true,
            campaigns: true,
        },
    });

    const balance = stats?.wallet?.balance || 0;
    const totalCampaigns = stats?.campaigns.length || 0;
    const activeCampaigns = stats?.campaigns.filter((c: any) => c.status === "ACTIVE").length || 0;
    const totalSpent = stats?.campaigns.reduce((acc: number, curr: any) => acc + curr.budget, 0) || 0;

    return (
        <>
            <header className="mb-8">
                <h2 className="text-2xl font-semibold text-white">Main Dashboard Overview</h2>
                <p className="text-slate-400 text-sm mt-1">Welcome back, {user?.name || user?.email}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-[#151921] p-5 rounded-xl border border-[#2A303C] shadow-sm hover:border-[#1877F2]/50 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-blue-900/30 text-[#1877F2]">
                            <span className="material-symbols-outlined text-xl">monetization_on</span>
                        </div>
                        <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors">Wallet Balance</span>
                    </div>
                    <div className="text-2xl font-bold text-white">${balance.toFixed(2)}</div>
                </div>

                <div className="bg-[#151921] p-5 rounded-xl border border-[#2A303C] shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-indigo-900/30 text-indigo-400">
                            <span className="material-symbols-outlined text-xl">layers</span>
                        </div>
                        <span className="text-sm font-medium text-slate-400">Total Campaigns</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{totalCampaigns}</div>
                </div>

                <div className="bg-[#151921] p-5 rounded-xl border border-[#2A303C] shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-sky-900/30 text-sky-400">
                            <span className="material-symbols-outlined text-xl">play_arrow</span>
                        </div>
                        <span className="text-sm font-medium text-slate-400">Active Campaigns</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{activeCampaigns}</div>
                </div>

                <div className="bg-[#151921] p-5 rounded-xl border border-[#2A303C] shadow-sm hidden lg:block lg:col-span-4 xl:col-span-1 border border-emerald-900/30">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-emerald-900/30 text-emerald-400">
                            <span className="material-symbols-outlined text-xl">payments</span>
                        </div>
                        <span className="text-sm font-medium text-slate-400">Total Spent</span>
                    </div>
                    <div className="text-2xl font-bold text-white">${totalSpent.toFixed(2)}</div>
                </div>
            </div>

            <div className="bg-[#151921] rounded-xl border border-[#2A303C] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Quick Statistics</h3>
                        <p className="text-sm text-slate-400 mt-1">Recent ad performance over the last 30 days.</p>
                    </div>
                    <div className="relative group">
                        <select className="appearance-none bg-[#0B0E14] border border-[#2A303C] group-hover:border-[#1877F2]/50 text-slate-200 py-2.5 pl-5 pr-12 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1877F2]/40 focus:border-[#1877F2] transition-all duration-300 cursor-pointer shadow-sm shadow-black/40">
                            <option value="30">Last 30 days</option>
                            <option value="7">Last 7 days</option>
                            <option value="1">Last 24 hours</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 group-hover:text-[#1877F2] transition-colors duration-300">
                            <span className="material-symbols-outlined text-base">unfold_more</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-6 mb-6 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#3b82f6]"></span>
                        <span className="text-slate-300">Impressions</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#22d3ee]"></span>
                        <span className="text-slate-300">Clicks</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#4ade80]"></span>
                        <span className="text-slate-300">Conversions</span>
                    </div>
                </div>

                <div className="h-[300px] w-full relative">
                    <PerformanceChart />
                </div>
            </div>
        </>
    )
}
