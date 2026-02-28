"use client";

import React from "react";
import { useLanguage } from "./LanguageProvider";

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
            <span className="material-symbols-outlined text-[18px]">language</span>
            <span>{locale === "ar" ? "EN" : "عربي"}</span>
        </button>
    );
}
