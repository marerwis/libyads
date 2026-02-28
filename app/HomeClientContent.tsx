"use client";

import React from "react";
import {
    BarChart3,
    ArrowRight,
    LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export default function HomeClientContent({ settings, page, session }: { settings: any, page: any, session: any }) {
    const { t } = useLanguage();

    return (
        <>
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-[#0B0E14]/85 backdrop-blur-md border-b border-white/5 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1877F2] to-blue-600 text-white flex items-center justify-center shrink-0 border border-white/10 shadow-lg shadow-blue-500/20">
                                <LayoutDashboard size={22} strokeWidth={2.5} />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-white">{settings?.siteName || 'Libya'} <span className="text-[#1877F2]">Ads</span></span>
                        </div>

                        <div className="hidden md:flex items-center space-x-8 bg-[#151921]/50 px-6 py-2 rounded-full border border-white/5 mx-4">
                            <Link href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">{t("features")}</Link>
                            <Link href="#how-it-works" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">{t("howItWorks")}</Link>
                            <Link href="#pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">{t("pricing")}</Link>
                        </div>

                        <div className="flex items-center gap-4">
                            <ThemeSwitcher compact />
                            <LanguageSwitcher />

                            {session ? (
                                <Link href="/dashboard" className="px-5 py-2.5 bg-[#1877F2] hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#1877F2]/25 transition-all active:scale-95 border border-[#1877F2]/50 inline-flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">dashboard</span>
                                    {t("dashboard")}
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login" className="px-5 py-2.5 border border-white/20 hover:bg-white/5 text-white text-sm font-semibold rounded-lg transition-all active:scale-95 inline-block text-center">{t("login")}</Link>
                                    <Link href="/login?tab=register" className="px-5 py-2.5 bg-[#1877F2] hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#1877F2]/25 transition-all active:scale-95 border border-[#1877F2]/50 inline-block text-center">{t("register")}</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(24,119,242,0.08)_0%,transparent_60%)]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8 max-w-xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#151921] border border-[#2A303C] text-[#1877F2] text-xs font-bold uppercase tracking-wider shadow-sm">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1877F2] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1877F2]"></span>
                                    </span>
                                    {t("newRelease")}
                                </div>

                                <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight dark:text-white text-slate-900 leading-[1.1]">
                                    {page?.heading ? page.heading.split(' ').slice(0, -2).join(' ') : 'Manage Ads'} <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1877F2] to-blue-400">
                                        {page?.heading ? page.heading.split(' ').slice(-2).join(' ') : 'Without Chaos'}
                                    </span>
                                </h1>

                                <div className="text-lg lg:text-xl text-slate-400 leading-relaxed font-light mt-6">
                                    {page?.content ? (
                                        <PortableText value={page.content} />
                                    ) : (
                                        'Your centralized platform for effortless Meta ad campaigns, billing, and automation. Scale your reach with professional-grade tools designed for clarity.'
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-4 pt-4">
                                    <Link href={session ? "/dashboard" : "/login"} className="px-8 py-4 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-xl shadow-xl shadow-[#1877F2]/20 transition-all active:scale-95 flex items-center gap-2 border border-white/10">
                                        {session ? t("enterDashboard") : t("getStarted")}
                                        <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
                                    </Link>
                                    <Link href="#features" className="px-8 py-4 bg-[#151921] border border-[#2A303C] text-slate-200 font-semibold rounded-xl hover:bg-white/5 transition-all active:scale-95 flex items-center justify-center">
                                        {t("learnMore")}
                                    </Link>
                                </div>

                                <div className="pt-8 flex items-center gap-4 text-sm text-slate-500">
                                    <div className="flex -space-x-2 rtl:space-x-reverse">
                                        <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-[#0B0E14] flex items-center justify-center text-xs text-white">JD</div>
                                        <div className="w-8 h-8 rounded-full bg-slate-600 border-2 border-[#0B0E14] flex items-center justify-center text-xs text-white">AS</div>
                                        <div className="w-8 h-8 rounded-full bg-slate-500 border-2 border-[#0B0E14] flex items-center justify-center text-xs text-white">+2k</div>
                                    </div>
                                    <p>{t("trustedBy")}</p>
                                </div>
                            </div>

                            <div className="relative group hidden lg:block">
                                <div className="absolute -inset-1 bg-gradient-to-r from-[#1877F2]/30 to-blue-600/30 blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-700"></div>
                                <div className="relative bg-[#151921] rounded-2xl border border-[#2A303C] shadow-2xl overflow-hidden ring-1 ring-white/5 pb-0">
                                    <div className="absolute top-0 left-0 right-0 h-10 bg-[#1A1F29] border-b border-[#2A303C] flex items-center px-4 gap-2 rtl:flex-row-reverse">
                                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                                    </div>
                                    <div className="pt-10">
                                        <img alt="Dashboard Interface Visualization" className="w-full h-auto opacity-90 mix-blend-normal" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdzhmZ4we9z4170ZI3ixVxaDL3xN0zdCb2rCGaXtXfHjmzXgFNms29wJXEjpNMukEau6zRekKXRZxEyC7dy9oSWBsSwvaRxmA4cT-PRFDUiKr53oPfBEtZF-XSmU1LypcMJSh6OOeQxxdwbXZIptSOsvx-g-7-sMzPonCiPUGCiy7iqTgKfBcqWcgoC8wX1zmN42XViLA2vvMZ7EhpnOUK2Ed_cTjwm0L0hkrz7B8MF_LsdY2VbZZ4VDp1IrYtZFo-wnsdRIh-KnUX" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="py-24 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#151921]/20 to-transparent pointer-events-none"></div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 dark:text-white text-slate-900">{t("whyChoose")} {settings?.siteName || 'Libya Ads'}</h2>
                            <p className="dark:text-slate-400 text-slate-600 text-lg">{settings?.siteDescription || 'Everything you need to scale your advertising efforts efficiently across the Meta ecosystem, wrapped in a focused UI.'}</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="group p-8 rounded-2xl dark:bg-[#151921] bg-white border dark:border-[#2A303C] border-slate-200 hover:shadow-[0_0_0_1px_rgba(24,119,242,0.3),_0_20px_40px_-10px_rgba(0,0,0,0.5)] transition-all duration-300">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1877F2]/20 to-transparent flex items-center justify-center text-[#1877F2] mb-6 group-hover:scale-110 transition-transform duration-300 border border-[#1877F2]/10">
                                    <span className="material-symbols-outlined text-3xl">settings_input_component</span>
                                </div>
                                <h3 className="text-xl font-bold mb-3 dark:text-white text-slate-900 group-hover:text-[#1877F2] transition-colors">{t("centralizedManagement")}</h3>
                                <p className="dark:text-slate-400 text-slate-600 leading-relaxed text-sm">{t("centralizedDesc")}</p>
                            </div>

                            <div className="group p-8 rounded-2xl dark:bg-[#151921] bg-white border dark:border-[#2A303C] border-slate-200 hover:shadow-[0_0_0_1px_rgba(24,119,242,0.3),_0_20px_40px_-10px_rgba(0,0,0,0.5)] transition-all duration-300">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1877F2]/20 to-transparent flex items-center justify-center text-[#1877F2] mb-6 group-hover:scale-110 transition-transform duration-300 border border-[#1877F2]/10">
                                    <span className="material-symbols-outlined text-3xl">credit_card</span>
                                </div>
                                <h3 className="text-xl font-bold mb-3 dark:text-white text-slate-900 group-hover:text-[#1877F2] transition-colors">{t("unifiedBilling")}</h3>
                                <p className="dark:text-slate-400 text-slate-600 leading-relaxed text-sm">{t("unifiedBillingDesc")}</p>
                            </div>

                            <div className="group p-8 rounded-2xl dark:bg-[#151921] bg-white border dark:border-[#2A303C] border-slate-200 hover:shadow-[0_0_0_1px_rgba(24,119,242,0.3),_0_20px_40px_-10px_rgba(0,0,0,0.5)] transition-all duration-300">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1877F2]/20 to-transparent flex items-center justify-center text-[#1877F2] mb-6 group-hover:scale-110 transition-transform duration-300 border border-[#1877F2]/10">
                                    <span className="material-symbols-outlined text-3xl">rocket_launch</span>
                                </div>
                                <h3 className="text-xl font-bold mb-3 dark:text-white text-slate-900 group-hover:text-[#1877F2] transition-colors">{t("aiAutomation")}</h3>
                                <p className="dark:text-slate-400 text-slate-600 leading-relaxed text-sm">{t("aiAutomationDesc")}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <section className="py-20 px-4">
                    <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-[#1877F2] to-blue-700 px-8 py-16 text-center text-white shadow-2xl shadow-[#1877F2]/10 relative overflow-hidden border border-white/10">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-20 pointer-events-none"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-white tracking-tight">{t("readyToScale")}</h2>
                            <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto font-light">{t("join10k")}</p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href={session ? "/dashboard" : "/login"} className="bg-white text-[#1877F2] px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg">
                                    {session ? t("openDashboard") : t("getStartedNow")}
                                </Link>
                                <Link href="#features" className="bg-blue-800/50 text-white border border-white/20 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-800 transition-colors flex items-center justify-center">{t("learnMore")}</Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="dark:bg-[#151921] bg-slate-100 border-t dark:border-[#2A303C] border-slate-200 pt-16 pb-8 mt-12 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="pt-8 border-t border-[#2A303C] flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                        <p>© 2024 Libya Ads. {t("allRightsReserved")}</p>
                        <div className="flex items-center gap-6">
                            <Link href="/data-deletion" className="hover:text-white transition-colors font-medium">{t("deleteUserData")}</Link>
                            <Link href="/privacy-policy" className="hover:text-white transition-colors font-medium">{t("privacyPolicy")}</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}
