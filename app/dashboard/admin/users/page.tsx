"use client"

import { useState, useEffect } from "react";
import { ChevronDown, PlusCircle, MinusCircle, Trash2, X, CreditCard, Ban } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

type User = {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    createdAt: string;
    wallet: { balance: number } | null;
    _count: {
        facebookPages: number;
        campaigns: number;
    }
};

export default function AdminUsersManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingRole, setUpdatingRole] = useState<string | null>(null);
    const [walletModal, setWalletModal] = useState<{ isOpen: boolean, user: User | null, amount: string, loading: boolean, action: 'add' | 'deduct' }>({
        isOpen: false, user: null, amount: "50", loading: false, action: 'add'
    });

    const { t, locale } = useLanguage();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, userName: string | null, newRole: string) => {
        const confirmMsg = t("confirmRoleChange").replace('{name}', userName || 'this user').replace('{role}', newRole);
        if (!window.confirm(confirmMsg)) {
            return; // Exit without changing
        }

        setUpdatingRole(userId);
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, newRole })
            });

            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            } else {
                const data = await res.json();
                alert(data.error || "Failed to update role");
            }
        } catch (error) {
            alert("An error occurred");
        } finally {
            setUpdatingRole(null);
        }
    };

    const handleDelete = async (userId: string, userName: string | null) => {
        const confirmMsg = t("confirmDeleteUser").replace('{name}', userName || 'this user');
        if (!window.confirm(confirmMsg)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== userId));
            } else {
                const data = await res.json();
                alert(data.error || "Failed to delete user");
            }
        } catch (error) {
            alert("An error occurred while deleting user");
        }
    };

    const handleWalletSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { user, amount, action } = walletModal;
        if (!user || isNaN(Number(amount)) || Number(amount) <= 0) return;

        setWalletModal(prev => ({ ...prev, loading: true }));
        try {
            const res = await fetch(`/api/admin/users/${user.id}/wallet`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: Number(amount), action })
            });

            if (res.ok) {
                // Update local state to reflect new balance
                setUsers(prev => prev.map(u => {
                    if (u.id === user.id) {
                        const currentBalance = u.wallet?.balance || 0;
                        const modifier = action === 'add' ? Number(amount) : -Number(amount);
                        return { ...u, wallet: { balance: currentBalance + modifier } };
                    }
                    return u;
                }));
                setWalletModal({ isOpen: false, user: null, amount: "50", loading: false, action: 'add' });
            } else {
                const data = await res.json();
                alert(data.error || `Failed to ${action} user's wallet`);
                setWalletModal(prev => ({ ...prev, loading: false }));
            }
        } catch (error) {
            alert(`An error occurred during wallet ${action}`);
            setWalletModal(prev => ({ ...prev, loading: false }));
        }
    };

    if (loading) return <div className="text-white">Loading users...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6 transition-colors duration-300">
            <header className="mb-8">
                <h2 className="text-2xl font-semibold dark:text-white text-slate-900">{t("usersManagement")}</h2>
                <p className="dark:text-slate-400 text-slate-500 text-sm mt-1">{t("viewAllUsers")}</p>
            </header>

            <div className="dark:bg-[#151921] bg-white rounded-xl border dark:border-[#2A303C] border-slate-200 overflow-hidden shadow-sm transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm dark:text-slate-300 text-slate-700 mt-0">
                        <thead className="dark:bg-[#0B0E14] bg-slate-50 text-xs uppercase dark:text-slate-400 text-slate-500 border-b dark:border-[#2A303C] border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">{t("nameEmail")}</th>
                                <th className="px-6 py-4 font-semibold">{t("walletBalance")}</th>
                                <th className="px-6 py-4 font-semibold text-center">{t("pages")}</th>
                                <th className="px-6 py-4 font-semibold text-center">{t("campaigns")}</th>
                                <th className="px-6 py-4 font-semibold">{t("joined")}</th>
                                <th className="px-6 py-4 font-semibold">{t("role")}</th>
                                <th className={`px-6 py-4 font-semibold ${locale === 'ar' ? 'text-left' : 'text-right'}`}>{t("actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-[#2A303C] divide-slate-100">
                            {users.map(user => (
                                <tr key={user.id} className="dark:hover:bg-[#1A1F29] hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold dark:text-white text-slate-900">{user.name || "N/A"}</div>
                                        <div className="text-xs dark:text-slate-500 text-slate-500">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-left" dir="ltr">
                                        <span className="font-mono">${user.wallet?.balance?.toFixed(2) || "0.00"}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center dark:text-slate-300 text-slate-700">
                                        {user._count.facebookPages}
                                    </td>
                                    <td className="px-6 py-4 text-center dark:text-slate-300 text-slate-700">
                                        {user._count.campaigns}
                                    </td>
                                    <td className="px-6 py-4 dark:text-slate-400 text-slate-500" dir="ltr">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative group inline-block">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, user.name, e.target.value)}
                                                disabled={updatingRole === user.id}
                                                className={`appearance-none dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 group-hover:border-[#1877F2]/50 text-sm rounded-xl py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#1877F2]/40 focus:border-[#1877F2] transition-all duration-300 cursor-pointer shadow-sm dark:shadow-black/40 shadow-slate-200 ${user.role === 'ADMIN' ? 'text-emerald-500 font-semibold' : 'dark:text-slate-300 text-slate-700'} ${locale === 'ar' ? 'pr-3 pl-8' : 'pl-3 pr-8'}`}
                                            >
                                                <option value="USER" className="dark:text-slate-300 text-slate-700">USER</option>
                                                <option value="ADMIN" className="text-emerald-500">ADMIN</option>
                                            </select>
                                            <div className={`pointer-events-none absolute inset-y-0 flex items-center px-2 dark:text-slate-500 text-slate-400 group-hover:text-blue-500 transition-colors duration-300 ${locale === 'ar' ? 'left-0' : 'right-0'}`}>
                                                <ChevronDown size={14} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 flex ${locale === 'ar' ? 'justify-start' : 'justify-end'} gap-3 mt-1`}>
                                        <button
                                            onClick={() => setWalletModal({ isOpen: true, user, amount: "50", loading: false, action: 'add' })}
                                            className="text-[#1877F2] hover:text-blue-400 transition-colors p-1 rounded hover:bg-blue-400/10"
                                            title={t("addWalletBalance")}
                                        >
                                            <PlusCircle size={18} />
                                        </button>
                                        <button
                                            onClick={() => setWalletModal({ isOpen: true, user, amount: user.wallet?.balance?.toString() || "0", loading: false, action: 'deduct' })}
                                            className="text-orange-400 hover:text-orange-300 transition-colors p-1 rounded hover:bg-orange-400/10"
                                            title={t("deductWalletBalance")}
                                            disabled={!user.wallet?.balance || user.wallet.balance <= 0}
                                        >
                                            <MinusCircle size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id, user.name)}
                                            className="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-400/10"
                                            title={t("deleteUser")}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        {t("noUsersFound")}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Wallet Modal */}
            {walletModal.isOpen && walletModal.user && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="dark:bg-[#151921] bg-white border dark:border-[#2A303C] border-slate-200 rounded-xl w-full max-w-sm shadow-xl flex flex-col">
                        <div className="p-5 border-b dark:border-[#2A303C] border-slate-200 flex justify-between items-center">
                            <h3 className="text-lg font-semibold dark:text-white text-slate-900">
                                {walletModal.action === 'add' ? t("topUpWallet") : t("deductWalletBalance")}
                            </h3>
                            <button
                                onClick={() => setWalletModal({ isOpen: false, user: null, amount: "50", loading: false, action: 'add' })}
                                className="dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleWalletSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="text-sm dark:text-slate-400 text-slate-600 block mb-1">{t("targetUser")}</label>
                                <div className="dark:text-white text-slate-900 font-medium dark:bg-[#0B0E14] bg-slate-50 px-4 py-3 rounded-lg border dark:border-[#2A303C] border-slate-200 flex justify-between items-center" dir="ltr">
                                    <span>{walletModal.user.name || walletModal.user.email}</span>
                                    <span className="text-sm dark:text-slate-500 text-slate-500 font-mono">Bal: ${walletModal.user.wallet?.balance?.toFixed(2) || "0.00"}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm dark:text-slate-400 text-slate-600 block mb-1 text-left">{t("amountUSD")}</label>
                                <div className="relative" dir="ltr">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 dark:text-slate-500 text-slate-400 font-medium">$</span>
                                    <input
                                        type="number"
                                        required min="0.01" step="0.01" max={walletModal.action === 'deduct' ? walletModal.user.wallet?.balance : undefined}
                                        value={walletModal.amount}
                                        onChange={e => setWalletModal(prev => ({ ...prev, amount: e.target.value }))}
                                        className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-lg pl-8 pr-4 py-3 dark:text-white text-slate-900 text-lg font-mono focus:border-[#1877F2] outline-none"
                                        placeholder="50.00"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={walletModal.loading}
                                className={`w-full mt-2 px-4 py-3 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${walletModal.action === 'add'
                                    ? 'bg-[#1877F2] hover:bg-blue-600'
                                    : 'bg-orange-500 hover:bg-orange-600'
                                    }`}
                            >
                                {walletModal.loading ? t("saving") : (
                                    <>
                                        {walletModal.action === 'add' ? <CreditCard size={14} /> : <Ban size={14} />}
                                        {walletModal.action === 'add' ? t("addFunds") : t("deductFunds")}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div >
    );
}
