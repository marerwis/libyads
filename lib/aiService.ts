// AI Auto-Reply Service via OpenRouter (Nemotron 3 Ultra Free)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

const OPENROUTER_MODEL =
    process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free";

const SYSTEM_PROMPT = `أنت مساعد مبيعات ذكي لمتجر إلكتروني يخدم عملاء في مجتمع مسلم محافظ. مهمتك الرد على تعليقات العملاء في فيسبوك بكلمات راقية، مهذبة، ومختصرة جداً (لا تتجاوز 3 كلمات إن أمكن). يجب أن تنوع صيغ الردود باستمرار لتجنب حظر فيسبوك. اعلم أنه فور نشر ردك، سيقوم النظام أوتوماتيكياً بإرسال رسالة خاصة للعميل تحتوي على جميع تفاصيل المتجر وسعر المنتج. لذلك، يجب أن يقتصر ردك في التعليق على الترحيب باحترام وتوجيه العميل لمراجعة رسائله الخاصة (مثل: "تم الرد بالخاص أخي"، "راجع رسائلك أستاذي"). استخدم اسم العميل بلباقة، ولا تقم أبداً باختراع أسعار أو تفاصيل.`;

const FALLBACK_REPLIES = [
    "أهلاً بك، راجع رسائلك الخاصة 🤍",
    "تم الرد في الخاص أخي العزيز ✨",
    "أهلاً بك، تفاصيلك في الرسائل الخاصة 💕",
    "راجع رسائلك الخاصة أستاذي 🌸",
    "تم التواصل معك في الخاص أهلاً بك 🌿",
    "أهلاً وسهلاً بك، تفقد بريدك الخاص ✉️"
];

export interface AiReplyOptions {
    senderName?: string;
    commentText: string;
    pageName?: string;
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
                        content: `اسم المعلق: ${cleanSenderName || "العميل"}\nنص التعليق: ${commentText || "استفسار"}\nاكتب رداً مناسباً ومختصراً جداً لهذا التعليق.`
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

        // Clean any quotes or backticks the model might enclose the answer in
        reply = reply.replace(/^[\"'«“]+|[\"'»”]+$/g, "").trim();

        return reply;
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
