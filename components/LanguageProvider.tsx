"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { dictionaries, DictionaryKey, Locale } from "@/lib/dictionaries";

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
        // Read from cookie first (server priority), then localStorage
        const cookieLang = Cookies.get("NEXT_LOCALE") as Locale;
        const savedLang = localStorage.getItem("preferred_lang") as Locale;

        const initialLang = cookieLang || savedLang || "ar"; // default to Arabic

        if (initialLang === "en" || initialLang === "ar") {
            setLocaleState(initialLang);
        }

        setMounted(true);
    }, []);

    const setLocale = (lang: Locale) => {
        setLocaleState(lang);
        localStorage.setItem("preferred_lang", lang);
        Cookies.set("NEXT_LOCALE", lang, { expires: 365, path: '/' }); // Important for Server Components

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
