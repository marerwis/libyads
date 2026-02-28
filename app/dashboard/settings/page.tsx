"use client"

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";

export default function UserSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "error" | "success", text: string } | null>(null);
    const [isOAuth, setIsOAuth] = useState(false);
    const [email, setEmail] = useState("");

    const { t, locale } = useLanguage();

    const [formData, setFormData] = useState({
        name: "",
        newPassword: "",
        confirmPassword: ""
    });

    useEffect(() => {
        fetch('/api/user/settings')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setFormData(prev => ({
                        ...prev,
                        name: data.name || ""
                    }));
                    setIsOAuth(data.isOAuth);
                    setEmail(data.email || "");
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: "error", text: "New passwords do not match." });
            return;
        }

        setSaving(true);

        try {
            const res = await fetch("/api/user/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    newPassword: formData.newPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: "success", text: "Settings saved successfully!" });
                setFormData(prev => ({ ...prev, newPassword: "", confirmPassword: "" }));
            } else {
                setMessage({ type: "error", text: data.error || "Failed to save settings." });
            }
        } catch (error) {
            setMessage({ type: "error", text: "An error occurred." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <div className="max-w-2xl">
            <header className="mb-8">
                <h2 className="text-2xl font-semibold dark:text-white text-slate-900">{t("accountSettings")}</h2>
                <p className="dark:text-slate-400 text-slate-500 text-sm mt-1">{t("manageProfile")}</p>
            </header>

            {message && (
                <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${message.type === 'error' ? 'dark:bg-red-900/30 bg-red-50 dark:text-red-400 text-red-600 border dark:border-red-900/50 border-red-200' : 'dark:bg-emerald-900/30 bg-emerald-50 dark:text-emerald-400 text-emerald-600 border dark:border-emerald-900/50 border-emerald-200'}`}>
                    {message.text}
                </div>
            )}

            <div className="dark:bg-[#151921] bg-white rounded-xl border dark:border-[#2A303C] border-slate-200 shadow-sm transition-colors">
                <form onSubmit={handleSubmit} className="divide-y dark:divide-[#2A303C] divide-slate-200">
                    {/* General Settings */}
                    <div className="p-6 space-y-6">
                        <h3 className="text-lg font-medium dark:text-white text-slate-900 mb-4">{t("generalSettings")}</h3>
                        <div>
                            <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">{t("fullName")}</label>
                            <input
                                type="text" name="name" value={formData.name} onChange={handleChange}
                                className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-lg px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] transition-colors"
                                placeholder={t("fullName")} required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">{t("emailAddress")}</label>
                            <input
                                type="email" value={email} disabled
                                className="w-full dark:bg-[#0B0E14] bg-slate-100 border dark:border-[#2A303C] border-slate-200 rounded-lg px-4 py-3 dark:text-slate-500 text-slate-400 cursor-not-allowed"
                                dir="ltr"
                            />
                            <p className="text-xs dark:text-slate-500 text-slate-400 mt-2">Email address cannot be changed natively.</p>
                        </div>
                    </div>

                    {/* Security Settings */}
                    <div className="p-6 space-y-6">
                        <h3 className="text-lg font-medium dark:text-white text-slate-900 mb-4">{t("securityPassword")}</h3>

                        {isOAuth ? (
                            <div className="dark:bg-blue-900/20 bg-blue-50 border dark:border-blue-900/50 border-blue-200 rounded-lg p-4">
                                <p className="text-sm dark:text-blue-400 text-blue-600">{t("thirdPartyLogin")}</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">{t("newPassword")}</label>
                                        <input
                                            type="password" name="newPassword" value={formData.newPassword} onChange={handleChange}
                                            className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-lg px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] transition-colors"
                                            placeholder={t("newPassword")}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">{t("confirmPassword")}</label>
                                        <input
                                            type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                                            className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-lg px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] transition-colors"
                                            placeholder={t("confirmPassword")}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className={`p-6 dark:bg-[#0B0E14]/50 bg-slate-50 flex ${locale === 'ar' ? 'justify-start' : 'justify-end'} rounded-b-xl`}>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-3 bg-[#1877F2] hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg shadow-lg transition-all active:scale-95"
                        >
                            {saving ? t("saving") : t("saveChanges")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
