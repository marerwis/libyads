"use client"

import { useState, useEffect } from "react";
import { Wallet, ReceiptText, Plus, X, ChevronDown, Upload, Landmark, FileText } from "lucide-react";

export default function WalletPage() {
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [amount, setAmount] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<string>("bank");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetch('/api/dashboard/stats')
            .then(res => res.json())
            .then(data => {
                setBalance(data.balance || 0);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

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

            {/* Add Balance Modal (Matching Payment Methods UX) */}
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
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                className="w-full appearance-none bg-[#0B0E14] border border-[#2A303C] group-hover:border-[#1877F2]/50 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]/40 focus:border-[#1877F2] transition-all duration-300 cursor-pointer shadow-sm shadow-black/40"
                                            >
                                                <optgroup label="API Gateways">
                                                    <option value="stripe">Stripe (Credit Card)</option>
                                                    <option value="paypal">PayPal</option>
                                                </optgroup>
                                                <optgroup label="Manual Verification">
                                                    <option value="bank">Bank Transfer</option>
                                                    <option value="vodafone">Vodafone Cash</option>
                                                </optgroup>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 group-hover:text-blue-500 transition-colors duration-300">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-[#2A303C]" />

                                {/* Conditional Render Based on Payment Method */}
                                {paymentMethod === "stripe" || paymentMethod === "paypal" ? (
                                    <div className="bg-[#1877F2]/10 border border-[#1877F2]/30 rounded-lg p-5 flex items-start gap-4">
                                        <div className="p-2 bg-[#1877F2]/20 rounded-lg text-[#1877F2]">
                                            <Wallet size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium mb-1">Instant Top-up</h4>
                                            <p className="text-sm text-slate-400">
                                                You will be securely redirected to the payment gateway to complete your transaction. Your balance will be updated instantly upon success.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-2 pb-2 border-b border-[#2A303C]">
                                            <Landmark size={20} className="text-blue-500" />
                                            <h4 className="text-blue-500 font-semibold">Manual Transfer Details</h4>
                                        </div>

                                        <div className="bg-[#0B0E14] p-4 rounded-lg border border-[#2A303C]">
                                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">Instructions</span>
                                            <p className="text-sm text-slate-300 leading-relaxed mb-4">
                                                Please calculate equivalent amount in local currency. Send the transfer to either the Bank Account or E-Wallet number. Write your username in the transfer note if applicable.
                                            </p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-[#1A1F29]/50 p-3 rounded-md border border-[#2A303C]">
                                                    <span className="text-xs text-slate-500 block mb-1">Bank IBAN</span>
                                                    <span className="text-sm text-white font-mono break-all">EG380020...1234</span>
                                                </div>
                                                <div className="bg-[#1A1F29]/50 p-3 rounded-md border border-[#2A303C]">
                                                    <span className="text-xs text-slate-500 block mb-1">Vodafone Cash</span>
                                                    <span className="text-sm text-white font-mono">01012345678</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Upload Transfer Receipt</label>
                                            <div className="flex items-center justify-center w-full">
                                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#2A303C] border-dashed rounded-lg cursor-pointer bg-[#0B0E14] hover:bg-[#1A1F29]/50 hover:border-blue-500/50 transition-colors">
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <Upload className="w-8 h-8 mb-3 text-slate-500" />
                                                        <p className="mb-1 text-sm text-slate-300"><span className="font-semibold text-blue-500">Click to upload</span> or drag and drop</p>
                                                        <p className="text-xs text-slate-500">PNG, JPG or PDF (MAX. 5MB)</p>
                                                    </div>
                                                    <input type="file" className="hidden" accept="image/*,.pdf" />
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Reference / Transaction Number</label>
                                            <input
                                                type="text"
                                                className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-lg px-4 py-3 text-white focus:border-[#1877F2] outline-none font-mono text-sm"
                                                placeholder="e.g. TRN-987654321"
                                            />
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-[#2A303C] flex justify-end gap-3 bg-[#0B0E14] rounded-b-xl shrink-0">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-[#2A303C] rounded-lg transition-colors border border-transparent hover:border-[#2A303C]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setIsSubmitting(true);
                                    setTimeout(() => {
                                        setIsSubmitting(false);
                                        setIsModalOpen(false);
                                        alert("Balance request submitted! Pending approval for manual payments.");
                                    }, 1500);
                                }}
                                disabled={isSubmitting || !amount}
                                className="px-6 py-2.5 text-sm font-bold bg-[#1877F2] hover:bg-blue-600 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting ? "Processing..." : paymentMethod === "stripe" || paymentMethod === "paypal" ? "Proceed to Payment" : "Submit Request"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
