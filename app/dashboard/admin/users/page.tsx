"use client"

import { useState, useEffect } from "react";

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
        const confirmMsg = `Are you sure you want to change the role of ${userName || 'this user'} to ${newRole}?`;
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
        const confirmMsg = `Are you sure you want to delete ${userName || 'this user'}? This action cannot be undone and will delete all their data.`;
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
        <div className="max-w-7xl mx-auto space-y-6">
            <header className="mb-8">
                <h2 className="text-2xl font-semibold text-white">Users Management</h2>
                <p className="text-slate-400 text-sm mt-1">View all registered users, their balances, and manage their system roles.</p>
            </header>

            <div className="bg-[#151921] rounded-xl border border-[#2A303C] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-[#0B0E14] text-xs uppercase text-slate-400 border-b border-[#2A303C]">
                            <tr>
                                <th className="px-6 py-4 font-medium">Name / Email</th>
                                <th className="px-6 py-4 font-medium">Wallet Balance</th>
                                <th className="px-6 py-4 font-medium">Pages</th>
                                <th className="px-6 py-4 font-medium">Campaigns</th>
                                <th className="px-6 py-4 font-medium">Joined</th>
                                <th className="px-6 py-4 font-medium">Role</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2A303C]">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-[#1A1F29] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{user.name || "N/A"}</div>
                                        <div className="text-xs text-slate-500">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono">${user.wallet?.balance?.toFixed(2) || "0.00"}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {user._count.facebookPages}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {user._count.campaigns}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative group inline-block">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, user.name, e.target.value)}
                                                disabled={updatingRole === user.id}
                                                className={`appearance-none bg-[#0B0E14] border border-[#2A303C] group-hover:border-[#1877F2]/50 text-sm rounded-xl py-1.5 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-[#1877F2]/40 focus:border-[#1877F2] transition-all duration-300 cursor-pointer shadow-sm shadow-black/40 ${user.role === 'ADMIN' ? 'text-emerald-400 font-semibold' : 'text-slate-300'}`}
                                            >
                                                <option value="USER" className="text-slate-300">USER</option>
                                                <option value="ADMIN" className="text-emerald-400">ADMIN</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 group-hover:text-[#1877F2] transition-colors duration-300">
                                                <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 flex justify-end gap-3 mt-1">
                                        <button
                                            onClick={() => setWalletModal({ isOpen: true, user, amount: "50", loading: false, action: 'add' })}
                                            className="text-[#1877F2] hover:text-blue-400 transition-colors p-1 rounded hover:bg-blue-400/10"
                                            title="Add Wallet Balance"
                                        >
                                            <span className="material-symbols-outlined text-lg">add_circle</span>
                                        </button>
                                        <button
                                            onClick={() => setWalletModal({ isOpen: true, user, amount: user.wallet?.balance?.toString() || "0", loading: false, action: 'deduct' })}
                                            className="text-orange-400 hover:text-orange-300 transition-colors p-1 rounded hover:bg-orange-400/10"
                                            title="Deduct Wallet Balance"
                                            disabled={!user.wallet?.balance || user.wallet.balance <= 0}
                                        >
                                            <span className="material-symbols-outlined text-lg">do_not_disturb_on</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id, user.name)}
                                            className="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-400/10"
                                            title="Delete User"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        No users found.
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
                    <div className="bg-[#151921] border border-[#2A303C] rounded-xl w-full max-w-sm shadow-xl flex flex-col">
                        <div className="p-5 border-b border-[#2A303C] flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-white">
                                {walletModal.action === 'add' ? 'Top Up Wallet' : 'Deduct Wallet Balance'}
                            </h3>
                            <button
                                onClick={() => setWalletModal({ isOpen: false, user: null, amount: "50", loading: false, action: 'add' })}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleWalletSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="text-sm text-slate-400 block mb-1">Target User</label>
                                <div className="text-white font-medium bg-[#0B0E14] px-4 py-3 rounded-lg border border-[#2A303C] flex justify-between items-center">
                                    <span>{walletModal.user.name || walletModal.user.email}</span>
                                    <span className="text-sm text-slate-500 font-mono">Bal: ${walletModal.user.wallet?.balance?.toFixed(2) || "0.00"}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-slate-400 block mb-1">Amount ($)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                                    <input
                                        type="number"
                                        required min="0.01" step="0.01" max={walletModal.action === 'deduct' ? walletModal.user.wallet?.balance : undefined}
                                        value={walletModal.amount}
                                        onChange={e => setWalletModal(prev => ({ ...prev, amount: e.target.value }))}
                                        className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-lg pl-8 pr-4 py-3 text-white text-lg font-mono focus:border-[#1877F2] outline-none"
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
                                {walletModal.loading ? "Processing..." : (
                                    <>
                                        <span className="material-symbols-outlined text-sm">
                                            {walletModal.action === 'add' ? 'payments' : 'money_off'}
                                        </span>
                                        {walletModal.action === 'add' ? 'Add Funds' : 'Deduct Funds'}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
