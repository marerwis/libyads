"use client"

import { useState, useEffect } from "react";

export default function WalletPage() {
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);

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
                        <div className="p-2 rounded-lg bg-emerald-900/30 text-emerald-400 border border-emerald-900/50">
                            <span className="material-symbols-outlined text-xl">account_balance</span>
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
                    <button className="px-6 py-2 bg-[#1877F2] hover:bg-blue-600 text-white font-medium rounded-lg text-sm transition-all shadow-lg active:scale-95">
                        Add Balance
                    </button>
                </div>
            </div>

            <div className="bg-[#151921] rounded-xl border border-[#2A303C] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#2A303C]">
                    <h3 className="text-lg font-medium text-white">Recent Transactions</h3>
                </div>
                <div className="p-12 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500 mb-4">
                        <span className="material-symbols-outlined text-3xl">receipt_long</span>
                    </div>
                    <h3 className="text-white font-medium mb-1">No transactions yet</h3>
                    <p className="text-slate-400 text-sm max-w-sm">Your deductive history and refunds will appear here once you launch a campaign.</p>
                </div>
            </div>
        </div>
    );
}
