import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import PerformanceChart from "./PerformanceChart"
import { Coins, Layers, Play, CreditCard, ChevronsUpDown, CheckCircle2, XCircle, BotMessageSquare, MessageCircleHeart, AlertTriangle, Activity, Bot, Sparkles } from "lucide-react"
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
    const isAdmin = user?.role === 'ADMIN';
    const ruleWhere = isAdmin ? {} : { userId: user?.id };

    const pageRules = await prisma.pageAutoReplyRule.findMany({
        where: ruleWhere,
        orderBy: { lastExecutedAt: 'desc' }
    });

    const postRules = await prisma.autoReplyRule.findMany({
        where: ruleWhere,
        orderBy: { lastExecutedAt: 'desc' }
    });

    // Separate AI Rules vs Regular Rules
    const aiPostRules = postRules.filter((r: any) => r.replyText === '__AI_REPLY__');
    const regularPostRules = postRules.filter((r: any) => r.replyText !== '__AI_REPLY__');

    const aiPageRules = pageRules.filter((r: any) => r.replyTexts?.includes('__AI_REPLY__'));
    const regularPageRules = pageRules.filter((r: any) => !r.replyTexts?.includes('__AI_REPLY__'));

    // Calculate start of day in Tripoli timezone
    const now = new Date();
    const tripoliNow = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Tripoli" }));
    const startOfDayTripoli = new Date(
        Date.UTC(tripoliNow.getFullYear(), tripoliNow.getMonth(), tripoliNow.getDate(), -2, 0, 0, 0) // UTC equivalent of 00:00 Tripoli (+2)
    );
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);

    const logs = await prisma.autoReplyLog.findMany({
        where: ruleWhere,
        orderBy: { createdAt: 'desc' }
    });

    const todayLogs = logs.filter((log: any) => new Date(log.createdAt).getTime() >= startOfDayTripoli.getTime());
    
    // AI Stats
    const totalAiPostRepliesToday = todayLogs.filter((log: any) => 
        (log.ruleType === "AI_POST" || (log.ruleType === "POST" && aiPostRules.some((r: any) => r.postId === log.postId))) && 
        log.status === "SUCCESS"
    ).length;

    const totalAiPageRepliesToday = todayLogs.filter((log: any) => 
        (log.ruleType === "AI_PAGE" || (log.ruleType === "PAGE" && aiPageRules.some((r: any) => r.pageId === log.pageId))) && 
        log.status === "SUCCESS"
    ).length;

    const recentFailedAiPost = logs.filter((log: any) => 
        (log.ruleType === "AI_POST" || aiPostRules.some((r: any) => r.postId === log.postId)) && 
        log.status === "FAILED" && new Date(log.createdAt).getTime() >= fiveMinutesAgo.getTime()
    ).length;

    const recentFailedAiPage = logs.filter((log: any) => 
        (log.ruleType === "AI_PAGE" || aiPageRules.some((r: any) => r.pageId === log.pageId)) && 
        log.status === "FAILED" && new Date(log.createdAt).getTime() >= fiveMinutesAgo.getTime()
    ).length;

    // Helper to calculate the most accurate, latest execution timestamp across rules and execution logs
    function getLatestExecution(rulesList: any[], logsList: any[], isAi: boolean, isPage: boolean) {
        // 1. Get all rules with a valid lastExecutedAt and pick the latest one
        const validRules = rulesList
            .filter((r: any) => r && r.lastExecutedAt)
            .sort((a: any, b: any) => new Date(b.lastExecutedAt).getTime() - new Date(a.lastExecutedAt).getTime());
        const latestRule = validRules[0];

        // 2. Find the latest matching log from autoReplyLog
        const targetType = isAi ? (isPage ? "AI_PAGE" : "AI_POST") : (isPage ? "PAGE" : "POST");
        const latestLog = logsList.find((l: any) => {
            if (l.ruleType === targetType) return true;
            if (isPage && l.ruleType === "PAGE" && rulesList.some((r: any) => r.pageId === l.pageId)) {
                return isAi ? rulesList.some((r: any) => r.pageId === l.pageId && r.replyTexts?.includes('__AI_REPLY__'))
                            : rulesList.some((r: any) => r.pageId === l.pageId && !r.replyTexts?.includes('__AI_REPLY__'));
            }
            if (!isPage && l.ruleType === "POST" && rulesList.some((r: any) => r.postId === l.postId)) {
                return isAi ? rulesList.some((r: any) => r.postId === l.postId && r.replyText === '__AI_REPLY__')
                            : rulesList.some((r: any) => r.postId === l.postId && r.replyText !== '__AI_REPLY__');
            }
            return false;
        });

        const ruleTime = latestRule?.lastExecutedAt ? new Date(latestRule.lastExecutedAt).getTime() : 0;
        const logTime = latestLog?.createdAt ? new Date(latestLog.createdAt).getTime() : 0;

        if (ruleTime === 0 && logTime === 0) {
            return { execution: null, status: null };
        }

        if (ruleTime >= logTime) {
            return {
                execution: latestRule.lastExecutedAt,
                status: latestRule.lastExecutionStatus || "SUCCESS"
            };
        } else {
            return {
                execution: latestLog.createdAt,
                status: latestLog.status || "SUCCESS"
            };
        }
    }

    const aiPageExec = getLatestExecution(aiPageRules, logs, true, true);
    const lastAiPageExecution = aiPageExec.execution;
    const lastAiPageStatus = aiPageExec.status;

    const aiPostExec = getLatestExecution(aiPostRules, logs, true, false);
    const lastAiPostExecution = aiPostExec.execution;
    const lastAiPostStatus = aiPostExec.status;

    // Regular Stats
    const totalRegularPostRepliesToday = todayLogs.filter((log: any) => 
        log.ruleType === "POST" && !aiPostRules.some((r: any) => r.postId === log.postId) && 
        log.status === "SUCCESS"
    ).length;

    const totalRegularPageRepliesToday = todayLogs.filter((log: any) => 
        log.ruleType === "PAGE" && !aiPageRules.some((r: any) => r.pageId === log.pageId) && 
        log.status === "SUCCESS"
    ).length;

    const recentFailedRegularPost = logs.filter((log: any) => 
        log.ruleType === "POST" && !aiPostRules.some((r: any) => r.postId === log.postId) && 
        log.status === "FAILED" && new Date(log.createdAt).getTime() >= fiveMinutesAgo.getTime()
    ).length;

    const recentFailedRegularPage = logs.filter((log: any) => 
        log.ruleType === "PAGE" && !aiPageRules.some((r: any) => r.pageId === log.pageId) && 
        log.status === "FAILED" && new Date(log.createdAt).getTime() >= fiveMinutesAgo.getTime()
    ).length;

    const regPostExec = getLatestExecution(regularPostRules, logs, false, false);
    const lastRegularPostExecution = regPostExec.execution;
    const lastRegularPostStatus = regPostExec.status;

    const regPageExec = getLatestExecution(regularPageRules, logs, false, true);
    const lastRegularPageExecution = regPageExec.execution;
    const lastRegularPageStatus = regPageExec.status;

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

            {/* AI Auto-Reply Readers Section (القارئ الذكي) */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold dark:text-white text-slate-900 flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white">
                            <Bot size={20} />
                        </div>
                        <span>القارئ الذكي (توقيت وإحصائيات الذكاء الاصطناعي AI)</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-semibold">
                            Nemotron 3 Ultra
                        </span>
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
                    {/* AI Post Auto-Reply Card */}
                    <div className="dark:bg-[#151921]/90 bg-white p-5 rounded-2xl border dark:border-purple-500/30 border-purple-300 shadow-sm hover:border-purple-500 transition-colors group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Bot size={80} />
                        </div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
                                    <Bot size={22} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold dark:text-white text-slate-900">القارئ الذكي للمنشورات</h4>
                                    <p className="text-xs text-slate-400 font-mono">AI Post Agent</p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                ذكاء اصطناعي
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div>
                                <span className="text-xs font-medium dark:text-slate-400 text-slate-500">ردود اليوم الذكية</span>
                                <div className="text-2xl font-bold dark:text-white text-slate-900 mt-1">{totalAiPostRepliesToday}</div>
                            </div>
                            <div>
                                <span className="text-xs font-medium dark:text-slate-400 text-slate-500">حالة البوت الذكي</span>
                                <div className="flex items-center gap-2 mt-1">
                                    {recentFailedAiPost > 0 ? (
                                        <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded-md text-xs font-bold">
                                            <AlertTriangle size={14} /> توقف ({recentFailedAiPost})
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md text-xs font-bold">
                                            <Activity size={14} /> يعمل بنشاط
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t dark:border-slate-800 border-slate-100 flex items-center justify-between relative z-10">
                            <div>
                                <span className="text-xs font-medium dark:text-slate-400 text-slate-500">توقيت آخر تنفيذ ذكي (ليبيا)</span>
                                <div className="flex items-center gap-2 mt-1">
                                    {lastAiPostExecution ? (
                                        <>
                                            <span className="text-sm font-semibold dark:text-slate-200 text-slate-700 dir-ltr text-left truncate">
                                                {new Date(lastAiPostExecution).toLocaleString('en-US', { timeZone: 'Africa/Tripoli', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                            {lastAiPostStatus === "SUCCESS" ? (
                                                <CheckCircle2 className="text-emerald-500 min-w-[16px]" size={16} />
                                            ) : lastAiPostStatus === "FAILED" ? (
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

                    {/* AI Page-Level Auto-Reply Card */}
                    <div className="dark:bg-[#151921]/90 bg-white p-5 rounded-2xl border dark:border-indigo-500/30 border-indigo-300 shadow-sm hover:border-indigo-500 transition-colors group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Sparkles size={80} />
                        </div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                                    <Sparkles size={22} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold dark:text-white text-slate-900">القارئ الشامل الذكي</h4>
                                    <p className="text-xs text-slate-400 font-mono">AI Page Agent</p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                شامل للصفحة
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div>
                                <span className="text-xs font-medium dark:text-slate-400 text-slate-500">ردود اليوم الذكية</span>
                                <div className="text-2xl font-bold dark:text-white text-slate-900 mt-1">{totalAiPageRepliesToday}</div>
                            </div>
                            <div>
                                <span className="text-xs font-medium dark:text-slate-400 text-slate-500">حالة البوت الذكي</span>
                                <div className="flex items-center gap-2 mt-1">
                                    {recentFailedAiPage > 0 ? (
                                        <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded-md text-xs font-bold">
                                            <AlertTriangle size={14} /> توقف ({recentFailedAiPage})
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md text-xs font-bold">
                                            <Activity size={14} /> يعمل بنشاط
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t dark:border-slate-800 border-slate-100 flex items-center justify-between relative z-10">
                            <div>
                                <span className="text-xs font-medium dark:text-slate-400 text-slate-500">توقيت آخر تنفيذ ذكي (ليبيا)</span>
                                <div className="flex items-center gap-2 mt-1">
                                    {lastAiPageExecution ? (
                                        <>
                                            <span className="text-sm font-semibold dark:text-slate-200 text-slate-700 dir-ltr text-left truncate">
                                                {new Date(lastAiPageExecution).toLocaleString('en-US', { timeZone: 'Africa/Tripoli', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                            {lastAiPageStatus === "SUCCESS" ? (
                                                <CheckCircle2 className="text-emerald-500 min-w-[16px]" size={16} />
                                            ) : lastAiPageStatus === "FAILED" ? (
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

                {/* Standard Auto-Reply Timing & Stats */}
                <h3 className="text-xl font-semibold dark:text-white text-slate-900 mb-4">{t("autoReplyStatistics" as any) || "إحصائيات الرد التلقائي العادي"}</h3>
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
                            <h4 className="text-lg font-bold dark:text-white text-slate-900">الرد التلقائي الشامل (العادي)</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div>
                                <span className="text-xs font-medium dark:text-slate-400 text-slate-500">ردود اليوم</span>
                                <div className="text-2xl font-bold dark:text-white text-slate-900 mt-1">{totalRegularPageRepliesToday}</div>
                            </div>
                            <div>
                                <span className="text-xs font-medium dark:text-slate-400 text-slate-500">حالة البوت</span>
                                <div className="flex items-center gap-2 mt-1">
                                    {recentFailedRegularPage > 0 ? (
                                        <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded-md text-xs font-bold">
                                            <AlertTriangle size={14} /> توقف ({recentFailedRegularPage})
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded-md text-xs font-bold">
                                            <Activity size={14} /> يعمل
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t dark:border-slate-800 border-slate-100 flex items-center justify-between relative z-10">
                            <div>
                                <span className="text-xs font-medium dark:text-slate-400 text-slate-500">آخر تنفيذ (ليبيا)</span>
                                <div className="flex items-center gap-2 mt-1">
                                    {lastRegularPageExecution ? (
                                        <>
                                            <span className="text-sm font-semibold dark:text-slate-200 text-slate-700 dir-ltr text-left truncate">
                                                {new Date(lastRegularPageExecution).toLocaleString('en-US', { timeZone: 'Africa/Tripoli', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {lastRegularPageStatus === "SUCCESS" ? (
                                                <CheckCircle2 className="text-green-500 min-w-[16px]" size={16} />
                                            ) : lastRegularPageStatus === "FAILED" ? (
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
                            <h4 className="text-lg font-bold dark:text-white text-slate-900">الرد التلقائي للمنشورات (العادي)</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div>
                                <span className="text-xs font-medium dark:text-slate-400 text-slate-500">ردود اليوم</span>
                                <div className="text-2xl font-bold dark:text-white text-slate-900 mt-1">{totalRegularPostRepliesToday}</div>
                            </div>
                            <div>
                                <span className="text-xs font-medium dark:text-slate-400 text-slate-500">حالة البوت</span>
                                <div className="flex items-center gap-2 mt-1">
                                    {recentFailedRegularPost > 0 ? (
                                        <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded-md text-xs font-bold">
                                            <AlertTriangle size={14} /> توقف ({recentFailedRegularPost})
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded-md text-xs font-bold">
                                            <Activity size={14} /> يعمل
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t dark:border-slate-800 border-slate-100 flex items-center justify-between relative z-10">
                            <div>
                                <span className="text-xs font-medium dark:text-slate-400 text-slate-500">آخر تنفيذ (ليبيا)</span>
                                <div className="flex items-center gap-2 mt-1">
                                    {lastRegularPostExecution ? (
                                        <>
                                            <span className="text-sm font-semibold dark:text-slate-200 text-slate-700 dir-ltr text-left truncate">
                                                {new Date(lastRegularPostExecution).toLocaleString('en-US', { timeZone: 'Africa/Tripoli', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {lastRegularPostStatus === "SUCCESS" ? (
                                                <CheckCircle2 className="text-green-500 min-w-[16px]" size={16} />
                                            ) : lastRegularPostStatus === "FAILED" ? (
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
