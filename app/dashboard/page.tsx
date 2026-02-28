import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import PerformanceChart from "./PerformanceChart"
import { Coins, Layers, Play, CreditCard, ChevronsUpDown } from "lucide-react"
import { getServerTranslations } from "@/lib/getServerTranslations"

export default async function Dashboard() {
    const session = await getServerSession()
    const { t } = await getServerTranslations();

    if (!session?.user?.email) {
        redirect("/login")
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    })

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
                <h2 className="text-2xl font-semibold text-white">{t("mainDashboardOverview")}</h2>
                <p className="text-slate-400 text-sm mt-1">{t("welcomeBack")}, {user?.name || user?.email}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" dir="ltr">
                {/* Stats cards usually stay LTR to keep numbers reading naturally, but flex containers wrap well */}
                <div className="bg-[#151921] p-5 rounded-xl border border-[#2A303C] shadow-sm hover:border-[#1877F2]/50 transition-colors group cursor-pointer text-left">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                                <Coins size={22} strokeWidth={2.5} />
                            </div>
                            <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors">{t("walletBalance")}</span>
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white">${balance.toFixed(2)}</div>
                </div>

                <div className="bg-[#151921] p-5 rounded-xl border border-[#2A303C] shadow-sm text-left">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                            <Layers size={22} strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-medium text-slate-400">{t("totalCampaigns")}</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{totalCampaigns}</div>
                </div>

                <div className="bg-[#151921] p-5 rounded-xl border border-[#2A303C] shadow-sm text-left">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
                            <Play size={22} strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-medium text-slate-400">{t("activeCampaigns")}</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{activeCampaigns}</div>
                </div>

                <div className="bg-[#151921] p-5 rounded-xl shadow-sm hidden lg:block lg:col-span-4 xl:col-span-1 border border-emerald-900/30 text-left">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                            <CreditCard size={22} strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-medium text-slate-400">{t("totalSpent")}</span>
                    </div>
                    <div className="text-2xl font-bold text-white">${totalSpent.toFixed(2)}</div>
                </div>
            </div>

            <div className="bg-[#151921] rounded-xl border border-[#2A303C] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white">{t("quickStatistics")}</h3>
                        <p className="text-sm text-slate-400 mt-1">{t("recentAdPerformance")}</p>
                    </div>
                    <div className="relative group">
                        <select className="appearance-none bg-[#0B0E14] border border-[#2A303C] group-hover:border-[#1877F2]/50 text-slate-200 py-2.5 pl-5 pr-12 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1877F2]/40 focus:border-[#1877F2] transition-all duration-300 cursor-pointer shadow-sm shadow-black/40">
                            <option value="30">{t("last30Days")}</option>
                            <option value="7">{t("last7Days")}</option>
                            <option value="1">{t("last24Hours")}</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 group-hover:text-blue-500 transition-colors duration-300">
                            <ChevronsUpDown size={16} />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-6 mb-6 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#3b82f6]"></span>
                        <span className="text-slate-300">{t("impressions")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#22d3ee]"></span>
                        <span className="text-slate-300">{t("clicks")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#4ade80]"></span>
                        <span className="text-slate-300">{t("conversions")}</span>
                    </div>
                </div>

                <div className="h-[300px] w-full relative" dir="ltr">
                    <PerformanceChart />
                </div>
            </div>
        </>
    )
}
