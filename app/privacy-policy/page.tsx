import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function PrivacyPolicy() {
    return (
        <div className={`min-h-screen bg-[#0B0E14] font-sans text-slate-300 antialiased selection:bg-[#1877F2]/30 selection:text-white pb-20 ${inter.className}`}>
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-[#0B0E14]/85 backdrop-blur-md border-b border-white/5 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#1877F2]/10 rounded-xl flex items-center justify-center border border-[#1877F2]/20">
                                <svg className="w-6 h-6 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M16.5 6C14.567 6 13 7.567 13 9.5C13 11.433 14.567 13 16.5 13C18.433 13 20 11.433 20 9.5C20 7.567 18.433 6 16.5 6ZM7.5 6C5.567 6 4 7.567 4 9.5C4 11.433 5.567 13 7.5 13C9.433 13 11 11.433 11 9.5C11 7.567 9.433 6 7.5 6ZM16.5 14.5C14.0147 14.5 12 16.5147 12 19C12 21.4853 14.0147 23.5 16.5 23.5C18.9853 23.5 21 21.4853 21 19C21 16.5147 18.9853 14.5 16.5 14.5ZM7.5 14.5C5.0147 14.5 3 16.5147 3 19C3 21.4853 5.0147 23.5 7.5 23.5C9.9853 23.5 12 21.4853 12 19C12 16.5147 9.9853 14.5 7.5 14.5Z" />
                                </svg>
                            </div>
                            <span className="font-bold text-xl tracking-tight text-white hover:text-[#1877F2] transition-colors">العودة للرئيسية</span>
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-right" dir="rtl">
                <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-10">سياسة الخصوصية</h1>

                <div className="space-y-8 text-lg text-slate-400 leading-relaxed">
                    <section className="bg-[#151921] p-8 rounded-2xl border border-[#2A303C] hover:border-white/10 transition-colors">
                        <h2 className="text-2xl font-bold text-white mb-4">مقدمة</h2>
                        <p>
                            توضح سياسة الخصوصية هذه كيف نقوم بجمع، استخدام، وحماية معلوماتك عند استخدامك لمنصتنا لإنشاء وإدارة حملات إعلانات فيسبوك (Meta Ads). نحن نلتزم بحماية خصوصيتك وضمان أمان بياناتك.
                        </p>
                    </section>

                    <section className="bg-[#151921] p-8 rounded-2xl border border-[#2A303C] hover:border-white/10 transition-colors">
                        <h2 className="text-2xl font-bold text-white mb-4">جمع البيانات</h2>
                        <p>
                            عند ربط حسابك الإعلاني على فيسبوك بمنصتنا، نقوم بجمع المعلومات الضرورية فقط لتمكينك من إنشاء الإعلانات، إدارة الحملات، ومتابعة الأداء. يشمل ذلك معلومات الملف الشخصي الأساسية ومعرفات حسابات الإعلانات والصفحات.
                        </p>
                    </section>

                    <section className="bg-[#151921] p-8 rounded-2xl border border-[#2A303C] hover:border-white/10 transition-colors">
                        <h2 className="text-2xl font-bold text-[#1877F2] mb-4">استخدام البيانات في إعلانات فيسبوك</h2>
                        <p className="mb-4">
                            نحن نحترم خصوصية بياناتك. يتم استخدام بياناتك بالاقتران مع واجهة برمجة تطبيقات ميتا (Meta API) للأغراض التاليةحصراً:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-300 mr-4">
                            <li>إنشاء ونشر الحملات الإعلانية على فيسبوك وإنستغرام.</li>
                            <li>قراءة وتحليل بيانات أداء إعلاناتك لتقديم تقارير دقيقة لك.</li>
                            <li>إدارة ميزانيتك الإعلانية وتتبع الإنفاق من خلال محفظتك في المنصة.</li>
                        </ul>
                        <p className="mt-6 p-4 bg-[#0B0E14] rounded-lg border border-white/5 text-sm text-slate-300">
                            <span className="font-bold text-white">هام جداً:</span> نحن لا نقوم ببيع بياناتك الشخصية أو بيانات حملاتك الإعلانية لأي أطراف ثالثة، ولا نستخدمها لأي أغراض تسويقية خارجية بأي شكل من الاشكال.
                        </p>
                    </section>

                    <section className="bg-[#151921] p-8 rounded-2xl border border-[#2A303C] hover:border-white/10 transition-colors">
                        <h2 className="text-2xl font-bold text-white mb-4">حماية وأمان البيانات</h2>
                        <p>
                            نحن نتخذ كافة الإجراءات الأمنية التقنية والتنظيمية اللازمة لحماية بياناتك من الوصول غير المصرح به أو التعديل أو الإفصاح أو الإتلاف. أرقام المرور ورموز الوصول المستقاة من فيسبوك يتم تشفيرها وتخزينها بشكل آمن وفق أعلى المعايير.
                        </p>
                    </section>

                    <section className="bg-[#151921] p-8 rounded-2xl border border-[#2A303C] hover:border-white/10 transition-colors">
                        <h2 className="text-2xl font-bold text-white mb-4">حقوقك والتحكم في بياناتك</h2>
                        <p>
                            يحق لك في أي وقت إلغاء ربط حساب فيسبوك الخاص بك وإبطال وصول منصتنا إلى بياناتك عبر إعدادات "تطبيقات شركاء الأعمال" في حسابك على فيسبوك. كما يمكنك طلب حذف كافة بياناتك المرتبطة بحسابك في منصتنا نهائياً عن طريق التواصل مع الدعم الفني.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
