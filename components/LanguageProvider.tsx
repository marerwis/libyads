"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Locale = "en" | "ar";

const dictionaries = {
    en: {
        // Navbar
        login: "Login",
        register: "Register",
        dashboard: "Dashboard",
        features: "Features",
        howItWorks: "How it Works",
        pricing: "Pricing",

        // Home Hero
        newRelease: "New v3.0 Release",
        getStarted: "Get Started",
        learnMore: "Learn More",
        trustedBy: "Trusted by marketers",
        enterDashboard: "Enter Dashboard",

        // Home Features
        whyChoose: "Why Choose",
        centralizedManagement: "Centralized Management",
        centralizedDesc: "Control all Meta ad accounts from one intuitive dashboard. Eliminate account switching and fragmentation with a unified view.",
        unifiedBilling: "Unified Billing",
        unifiedBillingDesc: "Streamlined payments and consolidated invoicing for all your linked accounts. No more payment headaches across multiple profiles.",
        aiAutomation: "AI Automation",
        aiAutomationDesc: "Leverage AI for optimized audience targeting and performance. Automate the mundane and focus on high-impact creative strategies.",

        // Home CTA
        readyToScale: "Ready to scale your business?",
        join10k: "Join 10,000+ marketers who trust our platform to manage their Meta advertising ecosystem.",
        getStartedNow: "Get Started Now",
        openDashboard: "Open Dashboard",

        // Home Footer
        allRightsReserved: "All rights reserved.",
        deleteUserData: "Delete User Data",
        privacyPolicy: "Privacy Policy",

        // Dashboard General
        campaignHistory: "Campaign History",
        createPromotion: "Create Promotion",
        wallet: "Wallet",
        facebookPages: "Facebook Pages",
        settings: "Settings",
        paymentMethods: "Payment Methods",
        usersManagement: "Users Management",
        metaConfig: "Meta Config",
        mainMenu: "MAIN MENU",
        administration: "ADMINISTRATION",
        logOut: "Log Out",

        // Language Switcher
        switchLang: "عربي"
    },
    ar: {
        // Navbar
        login: "تسجيل الدخول",
        register: "حساب جديد",
        dashboard: "لوحة التحكم",
        features: "المميزات",
        howItWorks: "آلية العمل",
        pricing: "الأسعار",

        // Home Hero
        newRelease: "تحديث الإصدار 3.0",
        getStarted: "ابدأ الآن",
        learnMore: "اعرف المزيد",
        trustedBy: "موثوق من قِبل المسوقين",
        enterDashboard: "دخول اللوحة",

        // Home Features
        whyChoose: "لماذا تختار",
        centralizedManagement: "إدارة مركزية",
        centralizedDesc: "تحكم في جميع حسابات إعلانات ميتا من لوحة واحدة. لا مزيد من تشتت الحسابات بفضل العرض الموحد للبيانات.",
        unifiedBilling: "فواتير موحدة",
        unifiedBillingDesc: "مدفوعات مبسطة وفواتير مجمعة لجميع حساباتك المرتبطة. تخلص من صداع المدفوعات.",
        aiAutomation: "أتمتة ذكية",
        aiAutomationDesc: "استفد من الذكاء الاصطناعي لاستهداف الجمهور بدقة وتحسين الأداء، للتركيز على استراتيجياتك الإبداعية.",

        // Home CTA
        readyToScale: "هل أنت مستعد لتوسيع نطاق أعمالك؟",
        join10k: "انضم إلى أكثر من 10 آلاف مسوق يثقون في منصتنا لإدارة نظام إعلانات ميتا لديهم.",
        getStartedNow: "ابدأ أعمالك الآن",
        openDashboard: "افتح لوحة التحكم",

        // Home Footer
        allRightsReserved: "جميع الحقوق محفوظة.",
        deleteUserData: "حذف بيانات المستخدم",
        privacyPolicy: "سياسة الخصوصية",

        // Dashboard General
        campaignHistory: "سجل الحملات",
        createPromotion: "إنشاء إعلان جديد",
        wallet: "المحفظة",
        facebookPages: "صفحات فيسبوك",
        settings: "الإعدادات",
        paymentMethods: "طرق الدفع",
        usersManagement: "إدارة المستخدمين",
        metaConfig: "إعدادات ميتا",
        mainMenu: "القائمة الرئيسية",
        administration: "الإدارة والنظام",
        logOut: "تسجيل الخروج",

        // Language Switcher
        switchLang: "English"
    }
};

type DictionaryKey = keyof typeof dictionaries.en;

interface LanguageContextType {
    locale: Locale;
    setLocale: (lang: Locale) => void;
    t: (key: DictionaryKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [locale, setLocaleState] = useState<Locale>("ar");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Read from localStorage on mount
        const saved = localStorage.getItem("preferred_lang") as Locale;
        if (saved === "en" || saved === "ar") {
            setLocaleState(saved);
        } else {
            // default is arabic based on user request "الاساس الموقع عربي" normally but we can check navigator
            setLocaleState("ar");
        }
        setMounted(true);
    }, []);

    const setLocale = (lang: Locale) => {
        setLocaleState(lang);
        localStorage.setItem("preferred_lang", lang);
        // Optional: add a class to body for global RTL/LTR
        if (lang === "ar") {
            document.documentElement.dir = "rtl";
            document.documentElement.lang = "ar";
        } else {
            document.documentElement.dir = "ltr";
            document.documentElement.lang = "en";
        }
    };

    // Sync direction on initial load
    useEffect(() => {
        if (mounted) {
            if (locale === "ar") {
                document.documentElement.dir = "rtl";
                document.documentElement.lang = "ar";
            } else {
                document.documentElement.dir = "ltr";
                document.documentElement.lang = "en";
            }
        }
    }, [locale, mounted]);

    const t = (key: DictionaryKey): string => {
        return dictionaries[locale]?.[key] || dictionaries["en"][key] || key;
    };

    // Prevent hydration mismatch by not rendering until mounted
    return (
        <LanguageContext.Provider value={{ locale, setLocale, t }}>
            {!mounted ? (
                <div style={{ visibility: 'hidden' }}>{children}</div>
            ) : (
                children
            )}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};
