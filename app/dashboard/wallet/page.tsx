"use client"

import { useState, useEffect } from "react";
import { Wallet, ReceiptText, Plus, X, ChevronDown, Landmark, MessageCircle } from "lucide-react";

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
        <div className="max-w-4xl mx-auto">
            <header className="mb-8">
                <h2 className="text-2xl font-semibold text-white">Wallet Management</h2>
                <p className="text-slate-400 text-sm mt-1">Manage your funds and view transaction history.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#151921] p-6 rounded-xl border border-[#2A303C] shadow-sm md:col-span-1">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
                            <Wallet size={24} strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-medium text-slate-400">Current Balance</span>
                    </div>
                    {loading ? (
                        <div className="text-2xl font-bold text-slate-500 animate-pulse">$...</div>
                    ) : (
                        <div className="text-3xl font-bold text-white">${balance.toFixed(2)}</div>
                    )}
                </div>

                <div className="bg-[#151921] p-6 rounded-xl border border-[#2A303C] shadow-sm md:col-span-2 flex flex-col justify-center items-center text-center">
                    <h3 className="text-lg font-medium text-white mb-2">Top Up Funds</h3>
                    <p className="text-sm text-slate-400 mb-4 max-w-sm">Add funds to your wallet to continue running Meta Ad Campaigns without interruption.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-2 bg-[#1877F2] hover:bg-blue-600 text-white font-medium rounded-lg text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Add Balance
                    </button>
                </div>
            </div>

            <div className="bg-[#151921] rounded-xl border border-[#2A303C] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#2A303C]">
                    <h3 className="text-lg font-medium text-white">Recent Transactions</h3>
                </div>
                <div className="p-12 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
                        <ReceiptText size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-white font-medium mb-1">No transactions yet</h3>
                    <p className="text-slate-400 text-sm max-w-sm">Your deductive history and refunds will appear here once you launch a campaign.</p>
                </div>
            </div>

            {/* Add Balance Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#151921] border border-[#2A303C] rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-[#2A303C] shrink-0">
                            <div>
                                <h3 className="text-xl font-semibold text-white">Add Balance</h3>
                                <p className="text-sm text-slate-400 mt-1">Top up your wallet to continue running ad campaigns.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white bg-[#0B0E14] p-2 rounded-lg border border-[#2A303C]">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto">
                            {paymentMethods.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-slate-400 mb-2">Loading payment methods or none available...</p>
                                </div>
                            ) : (
                                <form className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Amount Input */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Amount to Add (USD)</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 font-medium">$</span>
                                                <input
                                                    type="number"
                                                    min="10"
                                                    placeholder="0.00"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-lg pl-8 pr-4 py-3 text-white focus:border-[#1877F2] outline-none text-lg font-mono font-medium"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Payment Method Select */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method</label>
                                            <div className="relative group">
                                                <select
                                                    value={selectedMethodId}
                                                    onChange={(e) => setSelectedMethodId(e.target.value)}
                                                    className="w-full appearance-none bg-[#0B0E14] border border-[#2A303C] group-hover:border-[#1877F2]/50 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]/40 focus:border-[#1877F2] transition-all duration-300 cursor-pointer shadow-sm shadow-black/40"
                                                >
                                                    {paymentMethods.map(method => (
                                                        <option key={method.id} value={method.id}>
                                                            {method.name} {method.type.includes('BANK') || method.type.includes('WALLET') ? '(Manual)' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 group-hover:text-blue-500 transition-colors duration-300">
                                                    <ChevronDown size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="border-[#2A303C]" />

                                    {/* Conditional Render Based on Selected Target */}
                                    {isApiGateway ? (
                                        <div className="bg-[#1877F2]/10 border border-[#1877F2]/30 rounded-lg p-5 flex items-start gap-4">
                                            <div className="p-2 bg-[#1877F2]/20 rounded-lg text-[#1877F2]">
                                                <Wallet size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-medium mb-1">Instant Top-up - {selectedMethod?.name}</h4>
                                                <p className="text-sm text-slate-400">
                                                    You will be securely redirected to the {selectedMethod?.name} gateway to complete your transaction. Your balance will be updated instantly upon success.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-5" dir="rtl">
                                            <div className="bg-gradient-to-br from-[#0B0E14] to-[#111827] p-8 rounded-2xl border border-[#2A303C] shadow-lg relative overflow-hidden text-center">
                                                {/* Background Accent */}
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                                                <div className="relative z-10 flex flex-col items-center">
                                                    <div className="w-16 h-16 bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                                                        <MessageCircle className="text-[#25D366] w-8 h-8" />
                                                    </div>

                                                    <h4 className="text-2xl font-bold text-white mb-2 tracking-wide">مرحباً بك عزيزي المستخدم</h4>

                                                    <div className="space-y-3 mb-8 text-slate-300 text-sm md:text-base leading-relaxed max-w-lg mx-auto">
                                                        <p>نظامنا في تعبئة المحفظة في الوقت الحالي يتم عن طريق مراسلتنا على رقمنا على واتساب.</p>

                                                        <div className="py-4">
                                                            <div className="inline-block bg-[#1F2937] border border-[#374151] rounded-xl px-6 py-3 shadow-inner">
                                                                <span className="block text-xs text-slate-500 uppercase tracking-widest mb-1">الرقم المعتمد</span>
                                                                <span className="text-2xl font-mono text-[#25D366] font-bold tracking-wider">0914333564</span>
                                                            </div>
                                                        </div>

                                                        <p>
                                                            ارسل رسالة لهذا الرقم واذكر فيها رغبتك في شحن محفظتك في موقع <strong className="text-white">Libya Ads</strong> واذكر <strong className="text-white">المبلغ</strong> الذي تريده (${amount || '...'})
                                                        </p>
                                                        <p className="text-emerald-400 font-medium pb-2 border-b border-white/5 inline-block px-4">
                                                            سيتم الرد عليك فوراً وشحن محفظتك بنجاح شكراً لاختيارك لنا.
                                                        </p>
                                                    </div>

                                                    <p className="text-sm text-slate-400 mb-4 animate-pulse">اضغط على الأيقونة لمراسلتنا عبر واتساب مباشرة</p>

                                                    {/* WhatsApp Button */}
                                                    <a
                                                        href={`https://wa.me/218914333564?text=${encodeURIComponent(`أهلاً بك، أرغب في شحن محفظتي في مساحة Libya Ads بقيمة ${amount ? '$' + amount : 'محددة'}.`)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 font-bold text-white transition-all duration-300 bg-[#25D366] rounded-xl overflow-hidden hover:scale-105 hover:shadow-[0_0_20px_rgba(37,211,102,0.4)] active:scale-95 w-full sm:w-auto"
                                                    >
                                                        <MessageCircle className="w-5 h-5" />
                                                        <span>تواصل معنا عبر واتساب</span>
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
                        <div className="p-6 border-t border-[#2A303C] flex justify-end gap-3 bg-[#0B0E14] rounded-b-xl shrink-0">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-[#2A303C] rounded-lg transition-colors border border-transparent hover:border-[#2A303C]"
                            >
                                إغلاق
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
                                    Proceed to {selectedMethod?.name}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
