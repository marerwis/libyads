// AI Auto-Reply Service via OpenRouter (Nemotron 3 Ultra Free)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

const OPENROUTER_MODEL =
    process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free";

const SYSTEM_PROMPT = `أنت مساعد مبيعات ذكي ومحترف لصفحات ومتاجر فيسبوك في مجتمع عربي ومحافظ.
مهمتك: الرد على تعليقات العملاء بكلمات راقية، مهذبة، ومختصرة جداً، وتوجيههم لمراجعة الرسائل الخاصة (Inbox / DM) حيث تم إرسال كافة التفاصيل والأسعار لهم تلقائياً.

قواعد صارمة وإلزامية للرد:
1. ممنوع منعاً باتاً استخدام أي ألقاب أو توصيفات جندرية:
   - يُحظر تماماً استخدام: (أستاذ، أستاذي، أستاذة، أخي، أختي، دكتور، دكتورة، سيدي، سيدتي، كابتن، باشا، غالي، عزيزي، عزيزتي، إلخ).
   - لا تحاول أبداً تخمين جنس صاحب الحساب؛ خاطب الجميع بصيغة محايدة تماماً وراقية تناسب الذكر والأنثى بالتساوي.
2. الصيغ المحايدة الموصى بها:
   - استخدم عبارات ترحيبية مهذبة وعامة تختلف في كل مرة، مثل:
     - "أهلاً بك، راجع رسائلك الخاصة 🤍"
     - "تم الرد في الخاص، أهلاً وسهلاً بك ✨"
     - "أهلاً بك، تفاصيلك في الرسائل الخاصة 📩"
     - "راجع رسائلك الخاصة لطفاً 🌸"
     - "تم التواصل معك في الخاص، نورتنا 🌿"
3. الإيجاز الشديد:
   - اجعل الرد قصيراً وخفيفاً وطبيعياً (بضع كلمات فقط).
4. التنويع الدائم:
   - نوّع دائماً بين صيغ الردود والرموز التعبيرية اللطيفة لتجنب حظر فيسبوك للتكرار.
5. لا تذكر أسعاراً أو أرقاماً في التعليق العام؛ فقط وجّه العميل للخاص بلطف وأدب.`;

export const FALLBACK_REPLIES = [
    "أهلاً بك، راجع رسائلك الخاصة 🤍",
    "تم الرد في الخاص، أهلاً وسهلاً بك ✨",
    "أهلاً بك، تفاصيلك في الرسائل الخاصة 📩",
    "راجع رسائلك الخاصة لطفاً 🌸",
    "تم التواصل معك في الخاص، نورتنا 🌿",
    "أهلاً وسهلاً بك، تفقد بريدك الخاص ✉️",
    "شكراً لتواصلك، كل التفاصيل عندك في الخاص 🤍",
    "مرحباً بك، أرسلنا لك الرد في الخاص 💌",
    "تم الرد عبر الرسائل الخاصة، يومك سعيد 💫",
    "أهلاً وسهلاً، تجد كافة التفاصيل في بريدك الخاص 🌷",
    "تفضل بمراجعة رسائلك الخاصة 🤍",
    "أرسلنا لك كل التفاصيل في الخاص، يسعدنا تواصلك 🌟",
    "أهلاً بك، تم إرسال التفاصيل عبر الخاص 📩",
    "تم إرسال كافة المعلومات في رسالة خاصة 🌸",
    "مرحباً بك، الرد موجود في صندوق رسائلك 🤍",
    "تفقد رسائلك الخاصة، أهلاً بك دائماً ✨",
    "شكراً لاهتمامك، الرد كامل في الخاص 📩",
    "أهلاً بك، يمكنك مراجعة الخاص لمعرفة كامل التفاصيل 🌿",
    "تم الرد عليك في الخاص، أهلاً وسهلاً 🤍",
    "أهلاً بك، كل ما يهمك أرسلناه لك في الخاص ✉️",
    "مرحباً، تم التواصل في الرسائل الخاصة 🌸",
    "راجع صندوق الوارد في الخاص لطفاً ✨",
    "أهلاً بك، تجد الرد بانتظارك في الخاص 🤍",
    "يسعدنا تواصلك، أرسلنا لك في الخاص 💫",
    "تم الرد على استفسارك في الرسائل الخاصة 📩",
    "أهلاً وسهلاً، أرسلنا لك التفاصيل بالكامل في الخاص 🌷",
    "مرحباً بك، تفاصيل طلبك في الخاص 🤍",
    "تمت مراسلتك في الخاص، أهلاً بك 🌟",
    "أهلاً بك، الرد متوفر الآن في رسائلك الخاصة ✉️",
    "شكراً لك، تفقد الرسائل الخاصة لطفاً 🌿"
];

let lastFallbackIndex = -1;

export function getRandomFallback(): string {
    let index: number;
    do {
        index = Math.floor(Math.random() * FALLBACK_REPLIES.length);
    } while (index === lastFallbackIndex && FALLBACK_REPLIES.length > 1);
    lastFallbackIndex = index;
    return FALLBACK_REPLIES[index];
}

export interface AiReplyOptions {
    senderName?: string;
    commentText: string;
    pageName?: string;
}

/**
 * Sanitize AI reply by stripping any accidental gender-specific honorifics or titles
 */
export function sanitizeAiReply(text: string): string {
    if (!text) return getRandomFallback();

    // Remove quotes or backticks
    let cleaned = text.replace(/^[\"'«“`]+|[\"'»”`]+$/g, "").trim();

    // Regex to remove gendered titles/honorifics safely
    const forbiddenPattern = /(?:^|[\s،,؛;.-])(?:يا\s+)?(?:[أاإ]خ[يتا]\s+العزيز[ة]?|[أاإ]خت[يتا]\s+العزيزة|[أاإ]ستاذ[ةي]?|[أاإ]خ[يتا][ةي]?|دكتور[ةي]?|سيد[يية]|عزيز[يية]|غالي[ة]?|باشا|كابتن|حبيب[يية])(?=[\s،,؛;.-]|$)/gi;

    cleaned = cleaned.replace(forbiddenPattern, " ");
    cleaned = cleaned.replace(/\s{2,}/g, " ");
    cleaned = cleaned.replace(/[\s،,؛;.-]+$/, "");
    cleaned = cleaned.replace(/^[\s،,؛;.-]+/, "");
    cleaned = cleaned.replace(/\s+([،,؛;])/g, "$1");
    cleaned = cleaned.replace(/([،,؛;])\s*([،,؛;])/g, "$1");
    cleaned = cleaned.trim();

    if (!cleaned || cleaned.length > 100) {
        return getRandomFallback();
    }
    return cleaned;
}

/**
 * Generate a smart, human-like, polite, and brief reply for a Facebook comment using OpenRouter.
 */
export async function generateAiCommentReply(options: AiReplyOptions): Promise<string> {
    const { commentText } = options;
    // NOTE: senderName is intentionally ignored to prevent gender assumption errors

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": "https://libyadsweb.onrender.com",
                "X-Title": "Libya Ads AI Auto-Reply",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                temperature: 0.95,
                top_p: 0.9,
                frequency_penalty: 1.5,
                presence_penalty: 0.8,
                max_tokens: 60,
                messages: [
                    {
                        role: "system",
                        content: SYSTEM_PROMPT
                    },
                    {
                        role: "user",
                        content: `التعليق: ${commentText || "استفسار"}\n\nاكتب رداً قصيراً جداً (سطر واحد فقط) محايداً بدون أي ألقاب ولا توصيفات ولا اسم المعلق. وجّهه للخاص فقط.`
                    }
                ]
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errData = await response.text();
            console.error("OpenRouter API error response:", response.status, errData);
            return getRandomFallback();
        }

        const data = await response.json();
        let reply = data.choices?.[0]?.message?.content?.trim() || "";

        if (!reply) {
            return getRandomFallback();
        }

        return sanitizeAiReply(reply);
    } catch (err: any) {
        console.error("OpenRouter request failed, using safe fallback:", err.message || err);
        return getRandomFallback();
    }
}
