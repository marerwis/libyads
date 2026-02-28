"use client"

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, ChevronDown, Rocket, Users, Target, CalendarDays, DollarSign, Image as ImageIcon, ChevronRight, ChevronLeft, Upload, CheckCircle2 } from "lucide-react";

const availableCountries = [
    { code: "LY", name: "ليبيا (كامل الدولة)" },
    { code: "BENGHAZI", name: "بنغازي" },
    { code: "AL_JABAL_AL_AKHDAR", name: "الجبل الأخضر" },
    { code: "MARJ", name: "شعبية المرج" },
    { code: "TOBRUK", name: "طبرق ليبيا" },
    { code: "DERNA", name: "درنة ليبيا" },
    { code: "AJDABIYA", name: "اجدابيا" },
    { code: "MISRATA", name: "مصراته" },
    { code: "TARHUNA", name: "ترهونة" },
    { code: "TRIPOLI", name: "طرابلس" },
    { code: "JABAL_AL_GHARBI", name: "الجبل الغربي" },
];

const OBJECTIVES = [
    { id: "OUTCOME_AWARENESS", name: "الوعي بالعلامة التجارية (Awareness)" },
    { id: "OUTCOME_TRAFFIC", name: "الزيارات (Traffic)" },
    { id: "OUTCOME_ENGAGEMENT", name: "التفاعل (Engagement)" },
    { id: "OUTCOME_LEADS", name: "العملاء المحتملين (Leads)" },
    { id: "OUTCOME_SALES", name: "المبيعات (Sales/Conversions)" },
];

const STEPS = [
    { id: 1, name: "إعداد الحملة" },
    { id: 2, name: "الصفحة والمنشور" },
    { id: 3, name: "الجمهور" },
    { id: 4, name: "الميزانية" },
    { id: 5, name: "المراجعة والإطلاق" }
];

export default function CreateCampaignWizard() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);

    // Global Data
    const [pages, setPages] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        campaignName: "My New Campaign",
        objective: "OUTCOME_AWARENESS",
        pageId: "",
        adCreationType: "EXISTING_POST", // EXISTING_POST | NEW_CREATIVE
        postId: "",
        minAge: 18,
        maxAge: 65,
        genders: [] as number[],
        countries: ["LY"] as string[],
        budget: 50,
        duration: 3,
        primaryText: "",
        headline: "",
    });

    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "error" | "success", text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, pagesRes] = await Promise.all([
                    fetch('/api/dashboard/stats'),
                    fetch('/api/facebook/pages')
                ]);
                const statsData = await statsRes.json();
                setBalance(statsData.balance || 0);

                const pagesData = await pagesRes.json();
                if (Array.isArray(pagesData)) {
                    setPages(pagesData);
                    if (pagesData.length > 0) {
                        setFormData(prev => ({ ...prev, pageId: pagesData[0].pageId }));
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Fetch Posts when page changes & user uses existing post
    useEffect(() => {
        if (!formData.pageId || formData.adCreationType === 'NEW_CREATIVE') return;

        const fetchPosts = async () => {
            setLoadingPosts(true);
            try {
                const res = await fetch(`/api/facebook/posts?pageId=${formData.pageId}`);
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setPosts(data);
                    const firstPostId = data[0].id;
                    const purePostId = firstPostId.includes('_') ? firstPostId.split('_')[1] : firstPostId;
                    setFormData(prev => ({ ...prev, postId: purePostId }));
                } else {
                    setPosts([]);
                    setFormData(prev => ({ ...prev, postId: "" }));
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingPosts(false);
            }
        };
        fetchPosts();
    }, [formData.pageId, formData.adCreationType]);

    const handleNext = () => {
        setMessage(null);
        // Validation per step
        if (currentStep === 1) {
            if (!formData.campaignName) return setMessage({ type: "error", text: "يرجى إدخال اسم الحملة" });
        }
        if (currentStep === 2) {
            if (!formData.pageId) return setMessage({ type: "error", text: "يرجى اختيار صفحة" });
            if (!formData.postId) return setMessage({ type: "error", text: "يرجى اختيار منشور" });
        }
        if (currentStep === 3) {
            if (formData.countries.length === 0) return setMessage({ type: "error", text: "يرجى اختيار دولة واحدة على الأقل" });
        }
        if (currentStep === 4) {
            if (formData.budget <= 0) return setMessage({ type: "error", text: "ميزانية غير صالحة" });
            if (formData.budget > balance) return setMessage({ type: "error", text: "رصيد المحفظة غير كافٍ" });
        }

        if (currentStep < 5) {
            setCurrentStep(c => c + 1);
        }
    };

    const handleBack = () => {
        setMessage(null);
        if (currentStep > 1) {
            setCurrentStep(c => c - 1);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file));
        }
    };

    const handleLaunch = async () => {
        if (formData.budget > balance) {
            return setMessage({ type: "error", text: "الرصيد غير كافٍ." });
        }

        setSubmitting(true);
        setMessage(null);

        try {
            let mediaBase64 = undefined;
            if (formData.adCreationType === 'NEW_CREATIVE' && mediaFile) {
                // Read file as base64
                const reader = new FileReader();
                await new Promise((resolve) => {
                    reader.onload = () => {
                        // remove data:image/png;base64, prefix
                        const result = reader.result as string;
                        mediaBase64 = result.split(',')[1];
                        resolve(null);
                    };
                    reader.readAsDataURL(mediaFile);
                });
            }

            const payload = {
                ...formData,
                mediaBase64: mediaBase64
            };

            const res = await fetch("/api/campaign/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: "success", text: "تم إطلاق الحملة بنجاح! جاري التوجيه..." });
                setTimeout(() => router.push('/dashboard/campaigns'), 2000);
            } else {
                setMessage({ type: "error", text: data.details ? `${data.error} \nالتفاصيل: ${data.details}` : (data.error || "فشل إنشاء الحملة.") });
            }
        } catch (error) {
            setMessage({ type: "error", text: "حدث خطأ بالاتصال مع الخادم." });
        } finally {
            setSubmitting(false);
        }
    };

    // Components for Steps
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-xl font-bold text-white mb-2">إعداد الحملة الأساسي</h3>
                        <p className="text-sm text-slate-400 mb-6">ما هو هدفك التسويقي من هذه الحملة؟</p>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">اسم الحملة</label>
                            <input
                                type="text"
                                value={formData.campaignName}
                                onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                                className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">هدف الحملة (Objective)</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {OBJECTIVES.map(obj => (
                                    <button
                                        key={obj.id}
                                        onClick={() => setFormData({ ...formData, objective: obj.id })}
                                        className={`p-4 rounded-xl border text-right transition-all flex items-center justify-between ${formData.objective === obj.id ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-[#0B0E14] border-[#2A303C] text-slate-400 hover:border-slate-600'}`}
                                    >
                                        <span className="font-medium text-sm">{obj.name}</span>
                                        {formData.objective === obj.id && <CheckCircle2 size={18} className="text-indigo-400" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-xl font-bold text-white mb-2">الصفحة والمنشور</h3>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">صفحة فيسبوك</label>
                            <select
                                value={formData.pageId}
                                onChange={(e) => setFormData({ ...formData, pageId: e.target.value })}
                                className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500"
                            >
                                {pages.map(p => <option key={p.id} value={p.pageId}>{p.pageName}</option>)}
                            </select>
                        </div>

                        <div className="mt-4 animate-in fade-in">
                            <label className="block text-sm font-semibold text-slate-300 mb-2">اختر المنشور للترويج</label>
                            {loadingPosts ? (
                                <div className="text-slate-500 text-sm">جاري الجلب...</div>
                            ) : (
                                <select
                                    value={formData.postId}
                                    onChange={(e) => setFormData({ ...formData, postId: e.target.value })}
                                    className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="" disabled>اختر منشوراً...</option>
                                    {posts.map((post: any) => {
                                        const purePostId = post.id.includes('_') ? post.id.split('_')[1] : post.id;
                                        return (
                                            <option key={post.id} value={purePostId}>
                                                {post.message ? post.message.substring(0, 60) + "..." : "منشور وسائط"}
                                            </option>
                                        )
                                    })}
                                </select>
                            )}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-xl font-bold text-white mb-2">الجمهور والاستهداف</h3>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-3">الدول المستهدفة</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {availableCountries.map(country => {
                                    const isLibyaAllSelected = formData.countries.includes("LY");
                                    const isSelected = formData.countries.includes(country.code);
                                    const isDisabled = isLibyaAllSelected && country.code !== "LY";

                                    return (
                                        <button
                                            key={country.code}
                                            disabled={isDisabled}
                                            onClick={() => {
                                                if (country.code === "LY") {
                                                    setFormData({ ...formData, countries: isSelected ? [] : ["LY"] });
                                                } else {
                                                    const newCountries = isSelected
                                                        ? formData.countries.filter(c => c !== country.code)
                                                        : [...formData.countries.filter(c => c !== "LY"), country.code];
                                                    setFormData({ ...formData, countries: newCountries });
                                                }
                                            }}
                                            className={`text-xs text-right font-medium px-3 py-2.5 rounded-lg border transition-all ${isSelected ? 'bg-pink-500/20 border-pink-500/50 text-pink-200'
                                                : isDisabled ? 'bg-[#0B0E14]/50 border-[#2A303C]/30 text-slate-600 cursor-not-allowed opacity-50'
                                                    : 'bg-[#0B0E14] border-[#2A303C] text-slate-400 hover:border-slate-500'}`}
                                        >
                                            {country.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mt-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">العمر</label>
                                <div className="flex gap-2">
                                    <input type="number" value={formData.minAge} onChange={(e) => setFormData({ ...formData, minAge: Number(e.target.value) })} className="w-1/2 bg-[#0B0E14] border border-[#2A303C] rounded-lg p-2 text-white text-center" min="13" max="65" />
                                    <span className="text-slate-500 self-center">-</span>
                                    <input type="number" value={formData.maxAge} onChange={(e) => setFormData({ ...formData, maxAge: Number(e.target.value) })} className="w-1/2 bg-[#0B0E14] border border-[#2A303C] rounded-lg p-2 text-white text-center" min="13" max="65" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">الجنس</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setFormData({ ...formData, genders: [] })} className={`flex-1 py-2 text-sm rounded-lg border ${formData.genders.length === 0 ? 'bg-pink-500/20 border-pink-500/50 text-pink-200' : 'bg-[#0B0E14] border-[#2A303C] text-slate-400'}`}>الكل</button>
                                    <button onClick={() => setFormData({ ...formData, genders: [1] })} className={`flex-1 py-2 text-sm rounded-lg border ${formData.genders.includes(1) ? 'bg-pink-500/20 border-pink-500/50 text-pink-200' : 'bg-[#0B0E14] border-[#2A303C] text-slate-400'}`}>رجال</button>
                                    <button onClick={() => setFormData({ ...formData, genders: [2] })} className={`flex-1 py-2 text-sm rounded-lg border ${formData.genders.includes(2) ? 'bg-pink-500/20 border-pink-500/50 text-pink-200' : 'bg-[#0B0E14] border-[#2A303C] text-slate-400'}`}>نساء</button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-xl font-bold text-white mb-2">الميزانية والجدولة</h3>

                        <div className="bg-[#0B0E14] p-5 rounded-xl border border-[#2A303C] flex justify-between items-center mb-6">
                            <span className="text-slate-400">رصيد محفظتك المتاح</span>
                            <span className="text-emerald-400 font-bold text-xl">${balance.toFixed(2)}</span>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">الميزانية الإجمالية (دولار)</label>
                            <input
                                type="number"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                                className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-xl py-3 px-4 text-white text-lg font-bold"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">مدة الإعلان (أيام)</label>
                            <input
                                type="number"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                                className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-xl py-3 px-4 text-white"
                            />
                        </div>

                        <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-blue-200/50">الإنفاق اليومي:</span>
                                <span className="text-blue-300">${(formData.budget / formData.duration).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-blue-200/50">الرصيد المتبقي:</span>
                                <span className={`${balance - formData.budget < 0 ? 'text-red-400' : 'text-blue-300'}`}>${(balance - formData.budget).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-xl font-bold text-white mb-2">المراجعة النهائية</h3>

                        <div className="bg-[#0B0E14] border border-[#2A303C] rounded-xl p-5 space-y-4 text-sm">
                            <div className="flex justify-between border-b border-[#2A303C] pb-2">
                                <span className="text-slate-400">اسم الحملة:</span>
                                <span className="text-white font-medium">{formData.campaignName}</span>
                            </div>
                            <div className="flex justify-between border-b border-[#2A303C] pb-2">
                                <span className="text-slate-400">الهدف المختار:</span>
                                <span className="text-white font-medium">{OBJECTIVES.find(o => o.id === formData.objective)?.name}</span>
                            </div>
                            <div className="flex justify-between pb-2">
                                <span className="text-slate-400">الميزانية والمدة:</span>
                                <span className="text-white font-medium">${formData.budget} لمدة {formData.duration} أيام</span>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-900/10 border border-amber-500/20 rounded-xl text-amber-200/80 text-xs text-center leading-relaxed">
                            تأكد من صحة البيانات. سيتم فحص المحتوى وخلق الحملة الإعلانية على خوادم فيسبوك مباشرة وخصم التكلفة.
                        </div>
                    </div>
                );
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-400">جاري تحميل واجهة الإعداد...</div>;

    return (
        <div className="max-w-4xl mx-auto" dir="rtl">
            <header className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">إنشاء حملة إعلانية جديدة</h2>
                <div className="text-slate-400 text-sm">حدد خياراتك بدقة وصمم إعلانك خطوة بخطوة.</div>
            </header>

            {message && (
                <div className={`p-4 mb-6 rounded-xl text-sm font-medium shadow-lg animate-in fade-in ${message.type === 'error' ? 'bg-red-900/40 text-red-200 border border-red-500/50' : 'bg-emerald-900/40 text-emerald-200 border border-emerald-500/50'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-[#151921] rounded-2xl border border-[#2A303C] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
                {/* Left Sidebar Steps Indicator */}
                <div className="w-full md:w-1/3 bg-[#0E1117] p-6 border-l border-[#2A303C]">
                    <div className="space-y-6">
                        {STEPS.filter(s => !(s.id === 5 && formData.adCreationType === 'EXISTING_POST')).map((step, idx) => {
                            const isActive = currentStep === step.id;
                            const isPast = currentStep > step.id;
                            return (
                                <div key={step.id} className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${isActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-500/50 ring-offset-2 ring-offset-[#0E1117]' : isPast ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#2A303C] text-slate-500'}`}>
                                        {isPast ? <CheckCircle2 size={16} /> : idx + 1}
                                    </div>
                                    <span className={`text-sm font-medium transition-colors ${isActive ? 'text-white' : isPast ? 'text-slate-300' : 'text-slate-600'}`}>
                                        {step.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="w-full md:w-2/3 p-8 flex flex-col justify-between">
                    <div>
                        {renderStepContent()}
                    </div>

                    <div className="flex justify-between mt-10 pt-6 border-t border-[#2A303C]">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1 || submitting}
                            className="px-6 py-2.5 rounded-xl border border-[#2A303C] text-slate-300 hover:bg-[#2A303C] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                        >
                            <ChevronRight size={18} /> رجوع
                        </button>

                        {currentStep < 5 ? (
                            <button
                                onClick={handleNext}
                                className="px-8 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 text-sm font-medium flex items-center gap-2 transition-all active:scale-95"
                            >
                                التالي <ChevronLeft size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handleLaunch}
                                disabled={submitting}
                                className="px-8 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 text-sm font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {submitting ? "جاري الإطلاق..." : "الترويج الآن!"} <Rocket size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
