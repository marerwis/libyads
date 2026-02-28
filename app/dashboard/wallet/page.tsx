"use client"

import { useState, useEffect } from "react";
import { Wallet, ReceiptText, Plus, X, ChevronDown, Landmark, MessageCircle } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

type PaymentMethod = {
    id: string;
    name: string;
    type: string;
    details: string;
    instructions: string | null;
};

export default function WalletPage() {
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [amount, setAmount] = useState<string>("");
    const [selectedMethodId, setSelectedMethodId] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { t, locale } = useLanguage();

    useEffect(() => {
        // Fetch Balance
        fetch('/api/dashboard/stats')
            .then(res => res.json())
            .then(data => {
                setBalance(data.balance || 0);
            })
            .catch(() => { });

        // Fetch Payment Methods
        fetch('/api/payment-methods')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPaymentMethods(data);
                    if (data.length > 0) {
                        setSelectedMethodId(data[0].id);
                    }
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId);

    const isApiGateway = selectedMethod?.type === "STRIPE" || selectedMethod?.type === "PAYPAL";

    return (
        <div className="max-w-4xl mx-auto transition-colors duration-300">
            <header className="mb-8">
                <h2 className="text-2xl font-semibold dark:text-white text-slate-900">{t("walletManagement")}</h2>
                <p className="dark:text-slate-400 text-slate-500 text-sm mt-1">{t("manageFunds")}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="dark:bg-[#151921] bg-white p-6 rounded-xl border dark:border-[#2A303C] border-slate-200 shadow-sm md:col-span-1 transition-colors" dir="ltr">
                    <div className="flex items-center gap-3 mb-4 justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 shadow-inner">
                                <Wallet size={24} strokeWidth={2.5} />
                            </div>
                            <span className="text-sm font-medium dark:text-slate-400 text-slate-500">{t("currentBalance")}</span>
                        </div>
                    </div>
                    {loading ? (
                        <div className="text-2xl font-bold text-slate-500 animate-pulse">$...</div>
                    ) : (
                        <div className="text-3xl font-bold dark:text-white text-slate-900 text-left">${balance.toFixed(2)}</div>
                    )}
                </div>

                <div className="dark:bg-[#151921] bg-white p-6 rounded-xl border dark:border-[#2A303C] border-slate-200 shadow-sm md:col-span-2 flex flex-col justify-center items-center text-center transition-colors">
                    <h3 className="text-lg font-medium dark:text-white text-slate-900 mb-2">{t("topUpFunds")}</h3>
                    <p className="text-sm dark:text-slate-400 text-slate-500 mb-4 max-w-sm">{t("addFundsToWallet")}</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-2 bg-[#1877F2] hover:bg-blue-600 text-white font-medium rounded-lg text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2"
                    >
                        <Plus size={16} />
                        {t("addBalance")}
                    </button>
                </div>
            </div>

            <div className="dark:bg-[#151921] bg-white rounded-xl border dark:border-[#2A303C] border-slate-200 overflow-hidden shadow-sm transition-colors">
                <div className="p-6 border-b dark:border-[#2A303C] border-slate-200">
                    <h3 className="text-lg font-medium dark:text-white text-slate-900">{t("recentTransactions")}</h3>
                </div>
                <div className="p-12 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full dark:bg-slate-800/50 bg-slate-100 flex items-center justify-center dark:text-slate-500 text-slate-400 mb-4 shadow-inner">
                        <ReceiptText size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="dark:text-white text-slate-900 font-medium mb-1">{t("noTransactionsYet")}</h3>
                    <p className="dark:text-slate-400 text-slate-500 text-sm max-w-sm">{t("deductiveHistory")}</p>
                </div>
            </div>

            {/* Add Balance Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="dark:bg-[#151921] bg-white border dark:border-[#2A303C] border-slate-200 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b dark:border-[#2A303C] border-slate-200 shrink-0">
                            <div>
                                <h3 className="text-xl font-semibold dark:text-white text-slate-900">{t("addBalance")}</h3>
                                <p className="text-sm dark:text-slate-400 text-slate-500 mt-1">{t("topUpWallet")}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-800 dark:bg-[#0B0E14] bg-slate-100 p-2 rounded-lg border dark:border-[#2A303C] border-slate-200">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto">
                            {paymentMethods.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="dark:text-slate-400 text-slate-500 mb-2">Loading payment methods or none available...</p>
                                </div>
                            ) : (
                                <form className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Amount Input */}
                                        <div dir="ltr" className="text-left">
                                            <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">{t("amountToAdd")}</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 dark:text-slate-400 text-slate-500 font-medium">$</span>
                                                <input
                                                    type="number"
                                                    min="10"
                                                    placeholder="0.00"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-lg pl-8 pr-4 py-3 dark:text-white text-slate-900 focus:border-[#1877F2] outline-none text-lg font-mono font-medium"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Payment Method Select */}
                                        <div>
                                            <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">{t("paymentMethod")}</label>
                                            <div className="relative group">
                                                <select
                                                    value={selectedMethodId}
                                                    onChange={(e) => setSelectedMethodId(e.target.value)}
                                                    className="w-full appearance-none dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 group-hover:border-[#1877F2]/50 rounded-lg px-4 py-3 pr-10 dark:text-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1877F2]/40 focus:border-[#1877F2] transition-all duration-300 cursor-pointer shadow-sm dark:shadow-black/40 shadow-slate-200"
                                                >
                                                    {paymentMethods.map(method => (
                                                        <option key={method.id} value={method.id}>
                                                            {method.name} {method.type.includes('BANK') || method.type.includes('WALLET') ? `(${t('manualVerification')})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 dark:text-slate-500 text-slate-400 group-hover:text-blue-500 transition-colors duration-300">
                                                    <ChevronDown size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="dark:border-[#2A303C] border-slate-200" />

                                    {/* Conditional Render Based on Selected Target */}
                                    {isApiGateway ? (
                                        <div className="bg-[#1877F2]/10 border border-[#1877F2]/30 rounded-lg p-5 flex items-start gap-4">
                                            <div className="p-2 bg-[#1877F2]/20 rounded-lg text-[#1877F2]">
                                                <Wallet size={24} />
                                            </div>
                                            <div>
                                                <h4 className="dark:text-white text-slate-900 font-medium mb-1">{t("instantTopUp")} - {selectedMethod?.name}</h4>
                                                <p className="text-sm dark:text-slate-400 text-slate-600">
                                                    {t("secureRedirect")}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-5" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                                            <div className="bg-gradient-to-br dark:from-[#0B0E14] dark:to-[#111827] from-emerald-50 to-blue-50 p-8 rounded-2xl border dark:border-[#2A303C] border-blue-100 shadow-lg relative overflow-hidden text-center">
                                                {/* Background Accent */}
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                                                <div className="relative z-10 flex flex-col items-center">
                                                    <div className="w-16 h-16 bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                                                        <MessageCircle className="text-[#25D366] w-8 h-8" />
                                                    </div>

                                                    <h4 className="text-2xl font-bold dark:text-white text-slate-900 mb-2 tracking-wide">{t("welcomeDearUser")}</h4>

                                                    <div className="space-y-3 mb-8 dark:text-slate-300 text-slate-700 text-sm md:text-base leading-relaxed max-w-lg mx-auto">
                                                        <p>{t("transferInstructions")}</p>

                                                        <div className="py-4">
                                                            <div className="inline-block dark:bg-[#1F2937] bg-white border dark:border-[#374151] border-slate-200 rounded-xl px-6 py-3 shadow-inner" dir="ltr">
                                                                <span className="block text-xs dark:text-slate-500 text-slate-400 uppercase tracking-widest mb-1">{t("officialNumber")}</span>
                                                                <span className="text-2xl font-mono text-[#25D366] font-bold tracking-wider text-center block">0914333564</span>
                                                            </div>
                                                        </div>

                                                        <p>
                                                            {locale === 'en' ? (
                                                                <>Please send a message to this number stating your desire to recharge your wallet on <strong className="dark:text-white text-slate-900">Libya Ads</strong> and mention the <strong className="dark:text-white text-slate-900">Amount</strong> you want (${amount || '...'}).</>
                                                            ) : (
                                                                <>ارسل رسالة لهذا الرقم واذكر فيها رغبتك في شحن محفظتك في موقع <strong className="dark:text-white text-slate-900">Libya Ads</strong> واذكر <strong className="dark:text-white text-slate-900">المبلغ</strong> الذي تريده (${amount || '...'})</>
                                                            )}
                                                        </p>
                                                        <p className="text-emerald-500 font-medium pb-2 border-b dark:border-white/5 border-slate-200 inline-block px-4">
                                                            {t("immediateResponse")}
                                                        </p>
                                                    </div>

                                                    <p className="text-sm dark:text-slate-400 text-slate-500 mb-4 animate-pulse">{t("clickToWhatsApp")}</p>

                                                    {/* WhatsApp Button */}
                                                    <a
                                                        href={`https://wa.me/218914333564?text=${encodeURIComponent(locale === 'ar' ? `أهلاً بك، أرغب في شحن محفظتي في مساحة Libya Ads بقيمة ${amount ? '$' + amount : 'محددة'}.` : `Hello, I would like to top up my Libya Ads wallet by ${amount ? '$' + amount : 'a specific amount'}.`)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 font-bold text-white transition-all duration-300 bg-[#25D366] rounded-xl overflow-hidden hover:scale-105 hover:shadow-[0_0_20px_rgba(37,211,102,0.4)] active:scale-95 w-full sm:w-auto"
                                                        dir="ltr"
                                                    >
                                                        <MessageCircle className="w-5 h-5" />
                                                        <span>{t("contactViaWhatsApp")}</span>
                                                        <div className="absolute inset-0 h-full w-full bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left ease-out duration-300"></div>
                                                    </a>

                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </form>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t dark:border-[#2A303C] border-slate-200 flex justify-end gap-3 dark:bg-[#0B0E14] bg-slate-50 rounded-b-xl shrink-0" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 text-sm font-medium dark:text-slate-300 text-slate-700 dark:hover:text-white hover:text-slate-900 dark:hover:bg-[#2A303C] hover:bg-slate-200 rounded-lg transition-colors border border-transparent dark:hover:border-[#2A303C] hover:border-slate-300"
                            >
                                {t("close")}
                            </button>
                            {isApiGateway && (
                                <button
                                    onClick={() => {
                                        setIsSubmitting(true);
                                        setTimeout(() => {
                                            setIsSubmitting(false);
                                            setIsModalOpen(false);
                                            alert("Redirecting to API Gateway...");
                                        }, 1500);
                                    }}
                                    disabled={isSubmitting || !amount}
                                    className="px-6 py-2.5 text-sm font-bold bg-[#1877F2] hover:bg-blue-600 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {t("proceedToPayment")}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
