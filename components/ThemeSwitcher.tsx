"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "./LanguageProvider";

export default function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    const { locale } = useLanguage();
    const [mounted, setMounted] = React.useState(false);

    // useEffect only runs on the client, so now we can safely show the UI
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-full h-10 rounded-xl bg-slate-800/20 animate-pulse"></div>;
    }

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`flex items-center justify-between w-full px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300
                border dark:border-[#2A303C] border-slate-200
                dark:bg-[#151921] bg-white
                dark:text-slate-300 text-slate-700
                hover:dark:bg-[#2A303C]/50 hover:bg-slate-50
                ${locale === 'ar' ? 'flex-row-reverse' : 'flex-row'}
            `}
        >
            <div className={`flex items-center gap-3 ${locale === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                {isDark ? (
                    <Moon size={18} className="text-indigo-400" />
                ) : (
                    <Sun size={18} className="text-amber-500" />
                )}
                <span>{isDark ? (locale === 'ar' ? 'الوضع الداكن' : 'Dark Mode') : (locale === 'ar' ? 'الوضع الفاتح' : 'Light Mode')}</span>
            </div>
            <div className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors dark:bg-indigo-500/20 bg-amber-500/20">
                <span
                    className={`inline-block h-3 w-3 transform rounded-full transition-transform ${isDark
                            ? (locale === 'ar' ? '-translate-x-1 bg-indigo-400' : 'translate-x-5 bg-indigo-400')
                            : (locale === 'ar' ? '-translate-x-5 bg-amber-500' : 'translate-x-1 bg-amber-500')
                        }`}
                />
            </div>
        </button>
    );
}
