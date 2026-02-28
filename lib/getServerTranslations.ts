import { cookies } from "next/headers";
import { dictionaries, DictionaryKey, Locale } from "./dictionaries";

export async function getServerTranslations() {
    const cookieStore = await cookies();
    const localeStr = cookieStore.get("NEXT_LOCALE")?.value as Locale | undefined;

    // Default to 'ar' if not set
    const locale = localeStr === "en" ? "en" : "ar";

    return {
        t: (key: DictionaryKey): string => {
            return dictionaries[locale]?.[key] || dictionaries["en"][key] || key;
        },
        locale
    };
}
