import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import PerformanceChart from "./PerformanceChart"
import { Coins, Layers, Play, CreditCard, ChevronsUpDown, CheckCircle2, XCircle, BotMessageSquare, MessageCircleHeart } from "lucide-react"
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

    // Fetch Auto-Reply Stats
    const pageRules = await prisma.pageAutoReplyRule.findMany({
        where: { userId: user?.id },
        orderBy: { lastExecutedAt: 'desc' }
    });

    const postRules = await prisma.autoReplyRule.findMany({
        where: { userId: user?.id },
        orderBy: { lastExecutedAt: 'desc' }
    });

    const totalPageReplies = pageRules.reduce((acc, rule) => acc + rule.repliesSentCount, 0);
    const lastPageExecution = pageRules[0]?.lastExecutedAt;
    const lastPageExecutionStatus = pageRules[0]?.lastExecutionStatus;

    const totalPostReplies = postRules.reduce((acc, rule) => acc + rule.repliesSentCount, 0);
    const lastPostExecution = postRules[0]?.lastExecutedAt;
    const lastPostExecutionStatus = postRules[0]?.lastExecutionStatus;

    return (
        <>
            <header className="mb-8">
                <h2 className="text-2xl font-semibold dark:text-white text-slate-900">{t("mainDashboardOverview")}</h2>
                <p className="dark:text-slate-400 text-slate-500 text-sm mt-1">{t("welcomeBack")}, {user?.name || user?.email}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8" dir="ltr">
                {/* Stats cards usually stay LTR to keep numbers reading naturally, but flex containers wrap well */}
                <div className="dark:bg-[#151921] bg-white p-4 md:p-5 rounded-2xl border dark:border-[#2A303C] border-slate-200 shadow-sm hover:border-[#1877F2]/50 dark:hover:border-[#1877F2]/50 transition-colors group cursor-pointer text-left flex items-center justify-between">
                    <div>
                        <span className="text-xs md:text-sm font-medium dark:text-slate-400 text-slate-500 dark:group-hover:text-slate-300 transition-colors">{t("walletBalance")}</span>
                        <div className="text-xl md:text-2xl font-bold dark:text-white text-slate-900 mt-0.5">${balance.toFixed(2)}</div>
                    </div>
                    <div className="p-2 md:p-2.5 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform duration-300">
                        <Coins size={20} strokeWidth={2.5} className="md:w-[22px] md:h-[22px]" />
                    </div>
                </div>

                <div className="dark:bg-[#151921] bg-white p-4 md:p-5 rounded-2xl border dark:border-[#2A303C] border-slate-200 shadow-sm hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-colors group text-left flex items-center justify-between">
                    <div>
                        <span className="text-xs md:text-sm font-medium dark:text-slate-400 text-slate-500 dark:group-hover:text-slate-300 transition-colors">{t("totalCampaigns")}</span>
                        <div className="text-xl md:text-2xl font-bold dark:text-white text-slate-900 mt-0.5">{totalCampaigns}</div>
                    </div>
                    <div className="p-2 md:p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform duration-300">
                        <Layers size={20} strokeWidth={2.5} className="md:w-[22px] md:h-[22px]" />
                    </div>
                </div>

                <div className="dark:bg-[#151921] bg-white p-4 md:p-5 rounded-2xl border dark:border-[#2A303C] border-slate-200 shadow-sm hover:border-sky-500/50 dark:hover:border-sky-500/50 transition-colors group text-left flex items-center justify-between">
                    <div>
                        <span className="text-xs md:text-sm font-medium dark:text-slate-400 text-slate-500 dark:group-hover:text-slate-300 transition-colors">{t("activeCampaigns")}</span>
                        <div className="text-xl md:text-2xl font-bold dark:text-white text-slate-900 mt-0.5">{activeCampaigns}</div>
                    </div>
                    <div className="p-2 md:p-2.5 rounded-xl bg-sky-500/10 text-sky-500 group-hover:scale-110 transition-transform duration-300">
                        <Play size={20} strokeWidth={2.5} className="md:w-[22px] md:h-[22px]" />
                    </div>
                </div>

                <div className="dark:bg-[#151921] bg-white p-4 md:p-5 rounded-2xl shadow-sm hidden lg:flex lg:col-span-4 xl:col-span-1 border dark:border-emerald-900/30 border-emerald-500/30 text-left items-center justify-between group hover:border-emerald-500/50 transition-colors">
                    <div>
                        <span className="text-xs md:text-sm font-medium dark:text-slate-400 text-slate-500 dark:group-hover:text-slate-300 transition-colors">{t("totalSpent")}</span>
                        <div className="text-xl md:text-2xl font-bold dark:text-white text-slate-900 mt-0.5">${totalSpent.toFixed(2)}</div>
                    </div>
                    <div className="p-2 md:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform duration-300">
                        <CreditCard size={20} strokeWidth={2.5} className="md:w-[22px] md:h-[22px]" />
                    </div>
                </div>
            </div>

            {/* Auto-Reply Statistics Section */}
            <div className="mb-8">
                <h3 className="text-xl font-semibold dark:text-white text-slate-900 mb-4">{t("autoReplyStatistics") || "إحصائيات الرد التلقائي"}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Comprehensive Auto-Reply Stats */}
                    <div className="dark:bg-[#151921]/80 bg-white p-5 rounded-2xl border dark:border-purple-500/20 border-purple-200 shadow-sm hover:border-purple-500/50 transition-colors group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <BotMessageSquare size={80} />
                        </div>
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform duration-300">
                                <BotMessageSquare size={22} strokeWidth={2.5} />
                            </div>
                            <h4 className="text-lg font-bold dark:text-white text-slate-900">الرد التلقائي الشامل</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div>
                                <span className="text-xs font-medium dark:text-slate-400 text-slate-500">إجمالي الردود المرسلة</span>
                                <div className="text-2xl font-bold dark:text-white text-slate-900 mt-1">{totalPageReplies}</div>
                            </div>
                            <div>
                                <span className="text-xs font-medium dark:text-slate-400 text-slate-500">آخر تنفيذ</span>
                                <div className="flex items-center gap-2 mt-1">
                                    {lastPageExecution ? (
                                        <>
                                            <span className="text-sm font-semibold dark:text-slate-200 text-slate-700 dir-ltr text-left truncate">
                                                {new Date(lastPageExecution).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {lastPageExecutionStatus === "SUCCESS" ? (
                                                <CheckCircle2 className="text-green-500 min-w-[16px]" size={16} />
                                            ) : lastPageExecutionStatus === "FAILED" ? (
                                                <XCircle className="text-red-500 min-w-[16px]" size={16} />
                                            ) : null}
                                        </>
                                    ) : (
                                        <span className="text-sm dark:text-slate-500 text-slate-400">لم يُنفذ بعد</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Normal Auto-Reply Stats */}
                    <div className="dark:bg-[#151921]/80 bg-white p-5 rounded-2xl border dark:border-pink-500/20 border-pink-200 shadow-sm hover:border-pink-500/50 transition-colors group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <MessageCircleHeart size={80} />
                        </div>
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-500 group-hover:scale-110 transition-transform duration-300">
                                <MessageCircleHeart size={22} strokeWidth={2.5} />
                            </div>
                            <h4 className="text-lg font-bold dark:text-white text-slate-900">الرد التلقائي العادي</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div>
                                <span className="text-xs font-medium dark:text-slate-400 text-slate-500">إجمالي الردود المرسلة</span>
                                <div className="text-2xl font-bold dark:text-white text-slate-900 mt-1">{totalPostReplies}</div>
                            </div>
                            <div>
                                <span className="text-xs font-medium dark:text-slate-400 text-slate-500">آخر تنفيذ</span>
                                <div className="flex items-center gap-2 mt-1">
                                    {lastPostExecution ? (
                                        <>
                                            <span className="text-sm font-semibold dark:text-slate-200 text-slate-700 dir-ltr text-left truncate">
                                                {new Date(lastPostExecution).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {lastPostExecutionStatus === "SUCCESS" ? (
                                                <CheckCircle2 className="text-green-500 min-w-[16px]" size={16} />
                                            ) : lastPostExecutionStatus === "FAILED" ? (
                                                <XCircle className="text-red-500 min-w-[16px]" size={16} />
                                            ) : null}
                                        </>
                                    ) : (
                                        <span className="text-sm dark:text-slate-500 text-slate-400">لم يُنفذ بعد</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dark:bg-[#151921] bg-white rounded-xl border dark:border-[#2A303C] border-slate-200 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-lg font-semibold dark:text-white text-slate-900">{t("quickStatistics")}</h3>
                        <p className="text-sm dark:text-slate-400 text-slate-500 mt-1">{t("recentAdPerformance")}</p>
                    </div>
                    <div className="relative group">
                        <select className="appearance-none dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 group-hover:dark:border-[#1877F2]/50 group-hover:border-[#1877F2]/50 dark:text-slate-200 text-slate-700 py-2.5 pl-5 pr-12 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1877F2]/40 focus:border-[#1877F2] transition-all duration-300 cursor-pointer shadow-sm dark:shadow-black/40 shadow-slate-200">
                            <option value="30">{t("last30Days")}</option>
                            <option value="7">{t("last7Days")}</option>
                            <option value="1">{t("last24Hours")}</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 dark:text-slate-400 text-slate-500 group-hover:text-blue-500 transition-colors duration-300">
                            <ChevronsUpDown size={16} />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-6 mb-6 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#3b82f6]"></span>
                        <span className="dark:text-slate-300 text-slate-600">{t("impressions")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#22d3ee]"></span>
                        <span className="dark:text-slate-300 text-slate-600">{t("clicks")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#4ade80]"></span>
                        <span className="dark:text-slate-300 text-slate-600">{t("conversions")}</span>
                    </div>
                </div>

                <div className="h-[300px] w-full relative" dir="ltr">
                    <PerformanceChart />
                </div>
            </div>
        </>
    )
}
