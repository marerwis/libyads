"use client"

import { useState, useEffect } from "react";
import { Plus, CreditCard, Code, Settings, Trash2, X, ChevronDown, Landmark, Save } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

type PaymentMethod = {
    id: string;
    name: string;
    type: string;
    details: string;
    instructions: string | null;
    isActive: boolean;
    environment: "SANDBOX" | "LIVE";
    publicKey: string | null;
    secretKey: string | null;
    webhookSecret: string | null;
    createdAt: string;
};

export default function AdminPaymentMethods() {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

    const { t, locale } = useLanguage();

    const [formData, setFormData] = useState({
        name: "",
        type: "BANK_ACCOUNT",
        details: "",
        instructions: "",
        isActive: true,
        environment: "SANDBOX" as "SANDBOX" | "LIVE",
        publicKey: "",
        secretKey: "",
        webhookSecret: ""
    });

    useEffect(() => {
        fetchMethods();
    }, []);

    const fetchMethods = async () => {
        try {
            const res = await fetch("/api/admin/payment-methods");
            if (res.ok) {
                const data = await res.json();
                setMethods(data);
            }
        } catch (error) {
            console.error("Failed to fetch payment methods");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (method?: PaymentMethod) => {
        if (method) {
            setEditingMethod(method);
            setFormData({
                name: method.name,
                type: method.type,
                details: method.details,
                instructions: method.instructions || "",
                isActive: method.isActive,
                environment: method.environment || "SANDBOX",
                publicKey: method.publicKey || "",
                secretKey: method.secretKey || "",
                webhookSecret: method.webhookSecret || ""
            });
        } else {
            setEditingMethod(null);
            setFormData({
                name: "",
                type: "BANK_ACCOUNT",
                details: "",
                instructions: "",
                isActive: true,
                environment: "SANDBOX",
                publicKey: "",
                secretKey: "",
                webhookSecret: ""
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = editingMethod
                ? `/api/admin/payment-methods/${editingMethod.id}`
                : "/api/admin/payment-methods";

            const reqMethod = editingMethod ? "PATCH" : "POST";

            const res = await fetch(url, {
                method: reqMethod,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                await fetchMethods();
                setIsModalOpen(false);
            } else {
                alert("Failed to save payment method.");
            }
        } catch (error) {
            alert("An error occurred.");
        } finally {
            setSaving(false);
        }
    };

    const handleQuickToggleSwitch = async (id: string, field: "isActive" | "environment", currentValue: any) => {
        const newValue = field === "environment"
            ? (currentValue === "SANDBOX" ? "LIVE" : "SANDBOX")
            : !currentValue;

        try {
            const res = await fetch(`/api/admin/payment-methods/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [field]: newValue })
            });

            if (res.ok) {
                setMethods(prev => prev.map(m => m.id === id ? { ...m, [field]: newValue } : m));
            }
        } catch (error) {
            alert(`Failed to update ${field}.`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this payment method? This action cannot be undone.")) return;

        try {
            const res = await fetch(`/api/admin/payment-methods/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setMethods(prev => prev.filter(m => m.id !== id));
            } else {
                alert("Failed to delete.");
            }
        } catch (error) {
            alert("An error occurred while deleting.");
        }
    };

    if (loading) return <div className="dark:text-white text-slate-900">Loading payment methods...</div>;

    const isApiGateway = formData.type === "STRIPE" || formData.type === "PAYPAL";

    return (
        <div className="max-w-7xl mx-auto space-y-6 transition-colors duration-300">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-semibold dark:text-white text-slate-900">{t("paymentMethodsAndGateways")}</h2>
                    <p className="dark:text-slate-400 text-slate-500 text-sm mt-1">{t("configureManualMethods")}</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <Plus size={16} />
                    {t("addGatewayMethod")}
                </button>
            </header>

            {methods.length === 0 ? (
                <div className="dark:bg-[#151921] bg-white rounded-xl border dark:border-[#2A303C] border-slate-200 p-12 text-center flex flex-col items-center shadow-sm transition-colors">
                    <CreditCard size={60} strokeWidth={1} className="dark:text-slate-600 text-slate-400 mb-4 block" />
                    <h3 className="text-lg font-medium dark:text-white text-slate-900 mb-2">{t("noPaymentMethodsConfigured")}</h3>
                    <p className="dark:text-slate-400 text-slate-500 max-w-md mx-auto">{t("noPaymentMethodsDesc")}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {methods.map(method => {
                        const isApiType = method.type === "STRIPE" || method.type === "PAYPAL";

                        return (
                            <div key={method.id} className="dark:bg-[#151921] bg-white rounded-xl border dark:border-[#2A303C] border-slate-200 overflow-hidden flex flex-col h-full shadow-sm transition-colors">
                                {/* Header / Top Bar */}
                                <div className="p-5 border-b dark:border-[#2A303C] border-slate-200 flex items-start justify-between dark:bg-[#1A1F29]/50 bg-slate-50">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-semibold dark:text-white text-slate-900">{method.name}</h3>
                                            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider rounded-md uppercase border dark:bg-slate-800/50 bg-slate-200 text-slate-500 dark:text-slate-400 dark:border-slate-700 border-slate-300">
                                                {method.type.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Active / Inactive Toggle Switch */}
                                    <button
                                        onClick={() => handleQuickToggleSwitch(method.id, 'isActive', method.isActive)}
                                        className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${method.isActive
                                            ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                            : 'dark:bg-slate-800 bg-slate-100 dark:text-slate-400 text-slate-500 dark:border-slate-700 border-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        {method.isActive ? t("activeStatus") : t("inactiveStatus")}
                                    </button>
                                </div>

                                {/* Content Details */}
                                <div className="p-5 flex-1 flex flex-col space-y-4">
                                    {isApiType && (
                                        <div className="flex items-center justify-between p-3 rounded-lg border dark:border-[#2A303C] border-slate-200 dark:bg-[#0B0E14] bg-slate-50">
                                            <div className="flex items-center gap-2">
                                                <Code size={16} className="text-slate-400 dark:text-slate-500" />
                                                <span className="text-sm font-medium dark:text-slate-300 text-slate-700">{t("environment")}</span>
                                            </div>
                                            {/* Environment Toggle Switch */}
                                            <button
                                                onClick={() => handleQuickToggleSwitch(method.id, 'environment', method.environment)}
                                                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${method.environment === 'LIVE'
                                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                    }`}
                                            >
                                                {method.environment === "SANDBOX" ? t("sandboxTest") : t("live")}
                                            </button>
                                        </div>
                                    )}

                                    {!isApiType && (
                                        <div>
                                            <span className="text-xs font-medium dark:text-slate-500 text-slate-500 uppercase tracking-wider block mb-1">{t("accountInfo")}</span>
                                            <p className="text-sm dark:text-slate-300 text-slate-700 font-mono break-all dark:bg-[#0B0E14] bg-slate-50 p-3 rounded-lg border dark:border-[#2A303C] border-slate-200" dir="ltr">
                                                {method.details || "N/A"}
                                            </p>
                                        </div>
                                    )}

                                    {method.instructions && (
                                        <div>
                                            <span className="text-xs font-medium dark:text-slate-500 text-slate-500 uppercase tracking-wider block mb-1">{t("instructions")}</span>
                                            <p className="text-sm dark:text-slate-400 text-slate-600 dark:bg-[#0B0E14] bg-slate-50 p-3 rounded-lg border dark:border-[#2A303C] border-slate-200 line-clamp-3">
                                                {method.instructions}
                                            </p>
                                        </div>
                                    )}

                                    {isApiType && (
                                        <div className="space-y-2 mt-auto pt-4 border-t dark:border-[#2A303C] border-slate-200" dir="ltr">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="dark:text-slate-500 text-slate-500">{t("publicKey")}</span>
                                                <span className="font-mono dark:text-slate-300 text-slate-700 dark:bg-slate-800 bg-slate-200 px-2 py-0.5 rounded">{method.publicKey ? '••••••••' + method.publicKey.slice(-4) : 'Not Set'}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="dark:text-slate-500 text-slate-500">{t("secretKey")}</span>
                                                <span className="font-mono dark:text-slate-300 text-slate-700 dark:bg-slate-800 bg-slate-200 px-2 py-0.5 rounded">{method.secretKey ? '••••••••••••••••' : 'Not Set'}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Actions */}
                                <div className="p-4 border-t dark:border-[#2A303C] border-slate-200 dark:bg-[#0B0E14] bg-slate-50 flex justify-end gap-2" dir="ltr">
                                    <button
                                        onClick={() => handleOpenModal(method)}
                                        className="p-2 dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 dark:hover:bg-[#2A303C] hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center"
                                        title={t("editConfiguration")}
                                    >
                                        <Settings size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(method.id)}
                                        className="p-2 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="dark:bg-[#151921] bg-white border dark:border-[#2A303C] border-slate-200 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] transition-colors">
                        <div className="flex items-center justify-between p-6 border-b dark:border-[#2A303C] border-slate-200 shrink-0">
                            <div>
                                <h3 className="text-xl font-semibold dark:text-white text-slate-900">
                                    {editingMethod ? t("editConfiguration") : t("addPaymentMethod")}
                                </h3>
                                <p className="text-sm dark:text-slate-400 text-slate-500 mt-1">{t("configureIntegration")}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 dark:bg-[#0B0E14] bg-slate-100 p-2 rounded-lg border dark:border-[#2A303C] border-slate-200">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form id="payment-method-form" onSubmit={handleSubmit} className="space-y-6">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">{t("platformName")}</label>
                                        <input
                                            type="text" required
                                            value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-lg px-4 py-3 dark:text-white text-slate-900 focus:border-[#1877F2] outline-none"
                                            placeholder="e.g. Stripe, Vodafone Cash"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">{t("integrationType")}</label>
                                        <div className="relative group">
                                            <select
                                                value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                className="w-full appearance-none dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 group-hover:border-[#1877F2]/50 rounded-xl px-4 py-3 pr-10 dark:text-white  text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1877F2]/40 focus:border-[#1877F2] transition-all duration-300 cursor-pointer shadow-sm dark:shadow-black/40 shadow-slate-200"
                                            >
                                                <optgroup label={t("apiGateways")}>
                                                    <option value="STRIPE">{t("stripeApi")}</option>
                                                    <option value="PAYPAL">{t("paypalApi")}</option>
                                                </optgroup>
                                                <optgroup label={t("manualVerification")}>
                                                    <option value="BANK_ACCOUNT">{t("bankAccount")}</option>
                                                    <option value="E_WALLET">{t("eWallet")}</option>
                                                    <option value="OTHER">{t("otherManual")}</option>
                                                </optgroup>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 dark:text-slate-500 text-slate-400 group-hover:text-blue-500 transition-colors duration-300">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Toggle */}
                                <div className="flex items-center gap-3 p-4 dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-lg">
                                    <div className="flex-1">
                                        <label className="text-sm font-medium dark:text-white text-slate-900 block">{t("methodIsActive")}</label>
                                        <span className="text-xs dark:text-slate-400 text-slate-500">{t("ifDisabledUsersNotSee")}</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                                        <div className="w-11 h-6 dark:bg-slate-700 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1877F2]"></div>
                                    </label>
                                </div>

                                <hr className="dark:border-[#2A303C] border-slate-200" />

                                {isApiGateway ? (
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between pb-2 border-b dark:border-[#2A303C] border-slate-200">
                                            <h4 className="text-blue-500 font-semibold flex items-center gap-2">
                                                <Code size={20} />
                                                {t("apiConfiguration")}
                                            </h4>

                                            <div className="flex dark:bg-[#0B0E14] bg-slate-100 border dark:border-[#2A303C] border-slate-200 rounded-lg overflow-hidden p-1" dir="ltr">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, environment: "SANDBOX" })}
                                                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${formData.environment === 'SANDBOX' ? 'bg-amber-500/20 text-amber-500' : 'dark:text-slate-500 text-slate-500 dark:hover:text-white hover:text-slate-900'}`}
                                                >
                                                    {t("sandboxTest")}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, environment: "LIVE" })}
                                                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${formData.environment === 'LIVE' ? 'bg-red-500/20 text-red-500' : 'dark:text-slate-500 text-slate-500 dark:hover:text-white hover:text-slate-900'}`}
                                                >
                                                    {t("live")}
                                                </button>
                                            </div>
                                        </div>

                                        <div dir="ltr">
                                            <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">{t("publicKey")}</label>
                                            <input
                                                type="text" required={isApiGateway}
                                                value={formData.publicKey} onChange={(e) => setFormData({ ...formData, publicKey: e.target.value })}
                                                className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-lg px-4 py-3 dark:text-white text-slate-900 font-mono text-sm focus:border-[#1877F2] outline-none"
                                                placeholder="pk_test_..."
                                            />
                                        </div>

                                        <div dir="ltr">
                                            <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">{t("secretKey")}</label>
                                            <input
                                                type="text" required={isApiGateway}
                                                value={formData.secretKey} onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                                                className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-lg px-4 py-3 dark:text-white text-slate-900 font-mono text-sm focus:border-[#1877F2] outline-none"
                                                placeholder="sk_test_..."
                                            />
                                        </div>

                                        <div dir="ltr">
                                            <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">{t("webhookSecret")}</label>
                                            <input
                                                type="text"
                                                value={formData.webhookSecret} onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
                                                className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-lg px-4 py-3 dark:text-white text-slate-900 font-mono text-sm focus:border-[#1877F2] outline-none"
                                                placeholder="whsec_..."
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-2 pb-2 border-b dark:border-[#2A303C] border-slate-200">
                                            <Landmark size={20} className="text-blue-500" />
                                            <h4 className="text-blue-500 font-semibold">{t("manualDetails")}</h4>
                                        </div>

                                        <div dir="ltr">
                                            <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2 text-left">{t("accountNumberLink")}</label>
                                            <input
                                                type="text" required={!isApiGateway}
                                                value={formData.details} onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                                                className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-lg px-4 py-3 dark:text-white text-slate-900 font-mono focus:border-[#1877F2] outline-none"
                                                placeholder="e.g. 01012345678 or IBAN"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">{t("transferInstructionsAdmin")}</label>
                                            <textarea
                                                rows={4}
                                                value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                                className="w-full dark:bg-[#0B0E14] bg-slate-50 border dark:border-[#2A303C] border-slate-200 rounded-lg px-4 py-3 dark:text-white text-slate-900 focus:border-[#1877F2] outline-none resize-none"
                                                placeholder="E.g., Please send the screenshot of the transfer to our WhatsApp support."
                                            />
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className={`p-6 border-t dark:border-[#2A303C] border-slate-200 flex ${locale === 'ar' ? 'justify-start' : 'justify-end'} gap-3 dark:bg-[#0B0E14] bg-slate-50 rounded-b-xl shrink-0`}>
                            <button
                                type="button" onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 text-sm font-medium dark:text-slate-300 text-slate-500 dark:hover:text-white hover:text-slate-900 dark:hover:bg-[#2A303C] hover:bg-slate-200 rounded-lg transition-colors border border-transparent dark:hover:border-[#2A303C] hover:border-slate-300"
                            >
                                {t("cancel")}
                            </button>
                            <button
                                form="payment-method-form" type="submit" disabled={saving}
                                className="px-6 py-2.5 text-sm font-bold bg-[#1877F2] hover:bg-blue-600 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? t("saving") : (
                                    <>
                                        <Save size={16} />
                                        {t("saveConfiguration")}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
