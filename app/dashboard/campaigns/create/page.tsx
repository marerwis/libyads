"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, ChevronDown, Rocket, Users, Target, CalendarDays, DollarSign, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

const availableCountries = [
    { code: "SA", name: "Saudi Arabia (السعودية)" },
    { code: "AE", name: "United Arab Emirates (الإمارات)" },
    { code: "EG", name: "Egypt (مصر)" },
    { code: "KW", name: "Kuwait (الكويت)" },
    { code: "QA", name: "Qatar (قطر)" },
    { code: "BH", name: "Bahrain (البحرين)" },
    { code: "OM", name: "Oman (عمان)" },
    { code: "JO", name: "Jordan (الأردن)" },
    { code: "MA", name: "Morocco (المغرب)" },
    { code: "DZ", name: "Algeria (الجزائر)" },
    { code: "US", name: "United States (أمريكا)" },
    { code: "GB", name: "United Kingdom (بريطانيا)" },
];

export default function CreateCampaignPage() {
    const router = useRouter();
    const [pages, setPages] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "error" | "success", text: string } | null>(null);

    const [formData, setFormData] = useState({
        pageId: "",
        postId: "",
        budget: 10,
        duration: 3,
        minAge: 18,
        maxAge: 65,
        genders: [] as number[], // empty = all, 1 = men, 2 = women
        countries: ["SA", "AE"] as string[],
    });

    // Fetch initial data
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

    // Fetch posts when selected page changes
    useEffect(() => {
        if (!formData.pageId) {
            setPosts([]);
            return;
        }

        const fetchPosts = async () => {
            setLoadingPosts(true);
            try {
                const res = await fetch(`/api/facebook/posts?pageId=${formData.pageId}`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setPosts(data);
                    if (data.length > 0) {
                        const firstPostId = data[0].id;
                        const purePostId = firstPostId.includes('_') ? firstPostId.split('_')[1] : firstPostId;
                        setFormData(prev => ({ ...prev, postId: purePostId }));
                    } else {
                        setFormData(prev => ({ ...prev, postId: "" }));
                    }
                } else {
                    setPosts([]);
                    setFormData(prev => ({ ...prev, postId: "" }));
                }
            } catch (error) {
                console.error("Failed to fetch posts", error);
                setPosts([]);
                setFormData(prev => ({ ...prev, postId: "" }));
            } finally {
                setLoadingPosts(false);
            }
        };

        fetchPosts();
    }, [formData.pageId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ["budget", "duration", "minAge", "maxAge"].includes(name) ? Number(value) : value
        }));
    };

    const handleGenderChange = (genderVal: number | null) => {
        setFormData(prev => ({
            ...prev,
            genders: genderVal === null ? [] : [genderVal]
        }));
    };

    const handleCountryToggle = (code: string) => {
        setFormData(prev => {
            const current = [...prev.countries];
            if (current.includes(code)) {
                return { ...prev, countries: current.filter(c => c !== code) };
            } else {
                return { ...prev, countries: [...current, code] };
            }
        });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.budget > balance) {
            setMessage({ type: "error", text: "صيد محفظتك غير كافٍ لإطلاق هذه الحملة. يرجى الشحن أولاً." });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (formData.countries.length === 0) {
            setMessage({ type: "error", text: "يرجى اختيار دولة واحدة على الأقل للاستهداف." });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setSubmitting(true);
        setMessage(null);

        const payload = {
            pageId: formData.pageId,
            postId: formData.postId,
            budget: formData.budget,
            duration: formData.duration,
            targetingOptions: {
                minAge: formData.minAge,
                maxAge: formData.maxAge,
                genders: formData.genders,
                countries: formData.countries
            }
        };

        try {
            const res = await fetch("/api/campaign/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: "success", text: "تم إنشاء الحملة وإطلاقها بنجاح! سيتم توجيهك إلى سجل الحملات..." });
                setTimeout(() => {
                    router.push('/dashboard/campaigns');
                }, 2000);
            } else {
                setMessage({ type: "error", text: data.details ? `${data.error} \nالتفاصيل: ${data.details}` : (data.error || "فشل إنشاء الحملة.") });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error) {
            setMessage({ type: "error", text: "حدث خطأ غير متوقع بالخادم." });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-slate-400">جاري تحميل لوحة إنشاء الإعلانات...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto" dir="rtl">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">إنشاء إعلان جديد المتقدم</h2>
                    <p className="text-slate-400 text-sm">حدد جمهورك، ميزانيتك، والمنشور للوصول إلى أهدافك بضغطة زر.</p>
                </div>
                <div className="text-left bg-blue-900/20 px-6 py-3 rounded-2xl border border-blue-500/30 shadow-inner">
                    <p className="text-blue-300 text-sm font-medium mb-1">رصيد المحفظة</p>
                    <p className="text-2xl font-bold text-white">${balance.toFixed(2)}</p>
                </div>
            </header>

            {message && (
                <div className={`p-4 mb-8 rounded-xl text-sm font-medium shadow-lg backdrop-blur-sm ${message.type === 'error' ? 'bg-red-900/40 text-red-200 border border-red-500/50' : 'bg-emerald-900/40 text-emerald-200 border border-emerald-500/50'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleCreate} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Form Sections */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Section 1: Identity */}
                    <div className="bg-[#151921] rounded-2xl border border-[#2A303C] p-7 shadow-xl">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2A303C]">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-inner">
                                <ImageIcon size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">الهوية والإعلان</h3>
                                <p className="text-xs text-slate-400 mt-1">اختر الصفحة والمنشور الذي تريد الترويج له.</p>
                            </div>
                        </div>

                        {pages.length === 0 ? (
                            <div className="text-sm text-amber-400 bg-amber-900/20 p-4 rounded-lg border border-amber-900/50">
                                يجب عليك ربط صفحة فيسبوك أولاً من قسم (Facebook Pages).
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">صفحة فيسبوك المستهدفة</label>
                                    <div className="relative group">
                                        <select
                                            name="pageId" value={formData.pageId} onChange={handleChange}
                                            className="w-full appearance-none bg-[#0B0E14] border border-[#2A303C] group-hover:border-indigo-500/50 text-slate-200 py-3 pr-4 pl-10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all cursor-pointer shadow-sm"
                                            required
                                        >
                                            {pages.map(page => (
                                                <option key={page.id} value={page.pageId}>{page.pageName}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 pointer-events-none">
                                            <ChevronDown size={18} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">المنشور المستهدف</label>
                                    {loadingPosts ? (
                                        <div className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-xl px-4 py-3 text-slate-500 text-sm animate-pulse">
                                            جاري جلب المنشورات...
                                        </div>
                                    ) : posts.length === 0 ? (
                                        <div className="w-full bg-[#0B0E14] border border-red-900/50 rounded-xl px-4 py-3 text-red-400 text-sm">
                                            لا توجد منشورات في هذه الصفحة.
                                        </div>
                                    ) : (
                                        <div className="relative group">
                                            <select
                                                name="postId" value={formData.postId} onChange={handleChange}
                                                className="w-full appearance-none bg-[#0B0E14] border border-[#2A303C] group-hover:border-indigo-500/50 text-slate-200 py-3 pr-4 pl-10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all cursor-pointer shadow-sm"
                                                required
                                            >
                                                <option value="" disabled>اختر منشوراً للترويج...</option>
                                                {posts.map((post: any) => {
                                                    const date = new Date(post.created_time || Date.now()).toLocaleDateString('ar-EG');
                                                    const purePostId = post.id.includes('_') ? post.id.split('_')[1] : post.id;
                                                    const snippet = post.message
                                                        ? (post.message.length > 50 ? post.message.substring(0, 50) + "..." : post.message)
                                                        : "بدون نص (صورة أو فيديو)";
                                                    return (
                                                        <option key={post.id} value={purePostId}>
                                                            {date} - {snippet}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 pointer-events-none">
                                                <ChevronDown size={18} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 2: Audience */}
                    <div className="bg-[#151921] rounded-2xl border border-[#2A303C] p-7 shadow-xl">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2A303C]">
                            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 shadow-inner">
                                <Users size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">الجمهور والاستهداف</h3>
                                <p className="text-xs text-slate-400 mt-1">حدد من ترغب في وصول الإعلان إليه بشكل دقيق.</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Locations */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                    <Target size={16} className="text-slate-500" /> الموقع الجغرافي
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {availableCountries.map(country => {
                                        const isSelected = formData.countries.includes(country.code);
                                        return (
                                            <button
                                                type="button"
                                                key={country.code}
                                                onClick={() => handleCountryToggle(country.code)}
                                                className={`text-xs text-right font-medium px-3 py-2.5 rounded-lg border transition-all ${isSelected
                                                        ? 'bg-pink-500/20 border-pink-500/50 text-pink-200'
                                                        : 'bg-[#0B0E14] border-[#2A303C] text-slate-400 hover:border-slate-600'
                                                    }`}
                                            >
                                                {country.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Age and Gender */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-3">العمر (من - إلى)</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number" name="minAge" value={formData.minAge} onChange={handleChange} min="13" max="65"
                                            className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-pink-500 text-sm text-center"
                                        />
                                        <span className="text-slate-500">-</span>
                                        <input
                                            type="number" name="maxAge" value={formData.maxAge} onChange={handleChange} min="13" max="65"
                                            className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-pink-500 text-sm text-center"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-3">الجنس</label>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => handleGenderChange(null)} className={`flex-1 py-2.5 text-sm font-medium rounded-xl border transition-all ${formData.genders.length === 0 ? 'bg-pink-500/20 border-pink-500/50 text-pink-200' : 'bg-[#0B0E14] border-[#2A303C] text-slate-400'}`}>الكل</button>
                                        <button type="button" onClick={() => handleGenderChange(1)} className={`flex-1 py-2.5 text-sm font-medium rounded-xl border transition-all ${formData.genders.includes(1) ? 'bg-pink-500/20 border-pink-500/50 text-pink-200' : 'bg-[#0B0E14] border-[#2A303C] text-slate-400'}`}>الرجال</button>
                                        <button type="button" onClick={() => handleGenderChange(2)} className={`flex-1 py-2.5 text-sm font-medium rounded-xl border transition-all ${formData.genders.includes(2) ? 'bg-pink-500/20 border-pink-500/50 text-pink-200' : 'bg-[#0B0E14] border-[#2A303C] text-slate-400'}`}>النساء</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Budget & Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#151921] rounded-2xl border border-[#2A303C] p-7 shadow-xl sticky top-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2A303C]">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-inner">
                                <DollarSign size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">الميزانية والجدولة</h3>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                                    الميزانية الإجمالية (دولار)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-emerald-500 font-bold">
                                        $
                                    </div>
                                    <input
                                        type="number" name="budget" value={formData.budget} onChange={handleChange} min="1" max={Math.floor(balance)}
                                        className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-xl py-3 pr-10 pl-4 text-white focus:outline-none focus:border-emerald-500 text-lg font-bold shadow-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                                    <CalendarDays size={16} className="text-slate-500" /> مدة الإعلان (بالأيام)
                                </label>
                                <input
                                    type="number" name="duration" value={formData.duration} onChange={handleChange} min="1" max="30"
                                    className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 text-md font-bold shadow-sm"
                                    required
                                />
                                <div className="flex gap-2 mt-3">
                                    {[1, 3, 7, 14].map(days => (
                                        <button
                                            key={days}
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, duration: days }))}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${formData.duration === days ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-[#0B0E14] border-[#2A303C] text-slate-400 hover:border-slate-500'}`}
                                        >
                                            {days} أيام
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[#2A303C]">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-slate-400 text-sm">التكلفة اليومية التقريبية:</span>
                                    <span className="text-white font-medium">${(formData.budget / (formData.duration || 1)).toFixed(2)} / يوم</span>
                                </div>
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-slate-400 text-sm">الرصيد المتبقي بعد الإطلاق:</span>
                                    <span className={`font-medium ${balance - formData.budget < 0 ? 'text-red-400' : 'text-slate-300'}`}>
                                        ${Math.max(0, balance - formData.budget).toFixed(2)}
                                    </span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting || formData.budget > balance || pages.length === 0 || formData.countries.length === 0}
                                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-[#1877F2] hover:from-blue-500 hover:to-blue-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none text-white font-bold rounded-xl text-md transition-all shadow-lg shadow-blue-500/25 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <span className="animate-pulse">جاري الإطلاق...</span>
                                    ) : formData.budget > balance ? (
                                        "رصيد غير كافٍ"
                                    ) : (
                                        <>
                                            <Rocket size={20} />
                                            إطلاق الحملة الآن
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-[11px] text-slate-500 mt-3">سيتم خصم المبلغ من محفظتك فوراً.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
