"use client";

import React from "react";
import { useLanguage } from "./LanguageProvider";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
    const { locale, setLocale } = useLanguage();

    const toggleLanguage = () => {
        setLocale(locale === "ar" ? "en" : "ar");
    };

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-white font-medium text-sm transition-all shadow-sm"
            aria-label="Toggle Language"
        >
            <Globe size={18} strokeWidth={2} />
            <span>{locale === "ar" ? "EN" : "عربي"}</span>
        </button>
    );
}
