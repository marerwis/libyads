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
   - استخدم عبارات ترحيبية مهذبة وعامة، مثل:
     - "أهلاً بك، راجع رسائلك الخاصة 🤍"
     - "تم الرد في الخاص، أهلاً وسهلاً بك ✨"
     - "أهلاً بك، تفاصيلك في الرسائل الخاصة 📩"
     - "راجع رسائلك الخاصة لطفاً 🌸"
     - "تم التواصل معك في الخاص، نورتنا 🌿"
     - "أهلاً وسهلاً بك، تفقد بريدك الخاص ✉️"
     - "شكراً لتواصلك، كل التفاصيل عندك في الخاص 🤍"
3. الإيجاز الشديد:
   - اجعل الرد قصيراً وخفيفاً وطبيعياً (لا يتجاوز بضع كلمات).
4. التنويع الدائم:
   - نوّع دائماً بين صيغ الردود والرموز التعبيرية اللطيفة لتجنب حظر فيسبوك للتكرار.
5. لا تذكر أسعاراً أو أرقاماً في التعليق العام؛ فقط وجّه العميل للخاص بلطف وأدب.`;

const FALLBACK_REPLIES = [
    "أهلاً بك، راجع رسائلك الخاصة 🤍",
    "تم الرد في الخاص، أهلاً وسهلاً بك ✨",
    "أهلاً بك، تفاصيلك في الرسائل الخاصة 📩",
    "راجع رسائلك الخاصة لطفاً 🌸",
    "تم التواصل معك في الخاص، نورتنا 🌿",
    "أهلاً وسهلاً بك، تفقد بريدك الخاص ✉️",
    "شكراً لتواصلك، كل التفاصيل عندك في الخاص 🤍"
];

export interface AiReplyOptions {
    senderName?: string;
    commentText: string;
    pageName?: string;
}

/**
 * Sanitize AI reply by stripping any accidental gender-specific honorifics or titles
 */
export function sanitizeAiReply(text: string): string {
    if (!text) return text;

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

    return cleaned || "أهلاً بك، راجع رسائلك الخاصة 🤍";
}

/**
 * Generate a smart, human-like, polite, and brief reply for a Facebook comment using OpenRouter.
 */
export async function generateAiCommentReply(options: AiReplyOptions): Promise<string> {
    const { senderName, commentText } = options;
    const cleanSenderName = (senderName || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

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
                temperature: 0.7,
                max_tokens: 150,
                messages: [
                    {
                        role: "system",
                        content: SYSTEM_PROMPT
                    },
                    {
                        role: "user",
                        content: `اسم المعلق: ${cleanSenderName || "العميل"}\nنص التعليق: ${commentText || "استفسار"}\nاكتب رداً مناسباً ومختصراً جداً ومحايداً بدون أي ألقاب (مثل أستاذ أو أخي).`
                    }
                ]
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errData = await response.text();
            console.error("OpenRouter API error response:", response.status, errData);
            return getRandomFallback(cleanSenderName);
        }

        const data = await response.json();
        let reply = data.choices?.[0]?.message?.content?.trim() || "";

        if (!reply) {
            return getRandomFallback(cleanSenderName);
        }

        return sanitizeAiReply(reply);
    } catch (err: any) {
        console.error("OpenRouter request failed, using safe fallback:", err.message || err);
        return getRandomFallback(cleanSenderName);
    }
}

function getRandomFallback(name?: string): string {
    const randomTemplate = FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
    if (name) {
        return `${name} ${randomTemplate}`;
    }
    return randomTemplate;
}
