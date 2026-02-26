import { prisma } from "@/lib/prisma";

export const metaService = {
    /**
     * Retrieves the secure central Meta configuration for the platform.
     * Throws an error if not configured.
     */
    async getConfig() {
        // In a real app this might be a single row or cached
        const config = await prisma.metaSetting.findFirst();
        if (!config || !config.systemUserToken || !config.adAccountId || !config.businessId) {
            throw new Error("Meta Platform Configuration is missing or incomplete.");
        }
        return config;
    },

    /**
     * Translates common Meta API errors to friendly Arabic messages.
     */
    translateError(errorMsg: string, subcode?: number): string {
        const lowerMsg = errorMsg.toLowerCase();
        if (lowerMsg.includes("invalid post_id") || lowerMsg.includes("object_id parameter")) {
            return "معرف المنشور (Post ID) غير صحيح أو لا توجد صلاحية للوصول إليه. يرجى التأكد من أن المنشور تابع لصفحتك المربوطة.";
        }
        if (lowerMsg.includes("budget_sharing_enabled")) {
            return "يوجد خطأ في إعدادات ميزانية الحملة. حاول مجدداً.";
        }
        if (lowerMsg.includes("bid amount") || lowerMsg.includes("bid constraints")) {
            return "خطأ في استراتيجية عروض الأسعار (Bid Strategy). يرجى المحاولة لاحقاً.";
        }
        if (lowerMsg.includes("insufficient funds") || lowerMsg.includes("payment")) {
            return "حسابك الإعلاني على فيسبوك لا يحتوي على وسيلة دفع صالحة أو به رصيد غير كافٍ.";
        }
        if (lowerMsg.includes("permission") || subcode === 33) {
            return "لا توجد صلاحيات كافية للوصول إلى هذا المورد. تأكد من ربط الصفحة وإعطاء الصلاحيات المطلوبة.";
        }
        return `خطأ من فيسبوك: ${errorMsg}`;
    },

    /**
     * Step 3: Create Campaign
     */
    async createCampaign(name: string): Promise<string> {
        const config = await this.getConfig();
        const url = `https://graph.facebook.com/v19.0/act_${config.adAccountId}/campaigns`;

        const params = new URLSearchParams();
        params.append("name", name);
        params.append("objective", "OUTCOME_ENGAGEMENT");
        params.append("status", "PAUSED");
        params.append("special_ad_categories", "[]");
        params.append("is_adset_budget_sharing_enabled", "false");
        params.append("access_token", config.systemUserToken!);

        const res = await fetch(url, { method: "POST", body: params });
        const data = await res.json();

        if (data.error) throw new Error(this.translateError(data.error.message, data.error.error_subcode));
        return data.id; // Returns Campaign ID
    },

    /**
     * Step 4: Create Ad Set
     */
    async createAdSet(campaignId: string, dailyBudget: number, durationDays: number): Promise<string> {
        const config = await this.getConfig();
        const url = `https://graph.facebook.com/v19.0/act_${config.adAccountId}/adsets`;

        const budgetInMinorUnits = Math.round(dailyBudget * 100);

        const now = new Date();
        const endTime = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        const params = new URLSearchParams();
        params.append("name", `AdSet for ${campaignId}`);
        params.append("campaign_id", campaignId);
        params.append("daily_budget", budgetInMinorUnits.toString());
        params.append("start_time", now.toISOString());
        params.append("end_time", endTime.toISOString());
        params.append("billing_event", "IMPRESSIONS");
        params.append("optimization_goal", "POST_ENGAGEMENT");
        params.append("bid_strategy", "LOWEST_COST_WITHOUT_CAP");
        params.append("targeting", JSON.stringify({ geo_locations: { countries: ["US"] } }));
        params.append("status", "PAUSED");
        params.append("access_token", config.systemUserToken!);

        const res = await fetch(url, { method: "POST", body: params });
        const data = await res.json();

        if (data.error) throw new Error(this.translateError(data.error.message, data.error.error_subcode));
        return data.id;
    },

    /**
     * Step 5: Create Ad (using existing Post)
     */
    async createAd(adSetId: string, pageId: string, postId: string): Promise<string> {
        const config = await this.getConfig();

        const creativeUrl = `https://graph.facebook.com/v19.0/act_${config.adAccountId}/adcreatives`;
        const creativeParams = new URLSearchParams();
        creativeParams.append("name", `Creative for Post ${postId}`);

        // Handle standalone IDs vs PAGE_POSTID format properly if user entered valid formats
        let finalStoryId = postId;
        if (!postId.includes("_")) {
            finalStoryId = `${pageId}_${postId}`;
        }
        creativeParams.append("object_story_id", finalStoryId);
        creativeParams.append("access_token", config.systemUserToken!);

        const creativeRes = await fetch(creativeUrl, { method: "POST", body: creativeParams });
        const creativeData = await creativeRes.json();
        if (creativeData.error) throw new Error(this.translateError(creativeData.error.message, creativeData.error.error_subcode));

        const adUrl = `https://graph.facebook.com/v19.0/act_${config.adAccountId}/ads`;
        const adParams = new URLSearchParams();
        adParams.append("name", `Ad for Post ${postId}`);
        adParams.append("adset_id", adSetId);
        adParams.append("creative", JSON.stringify({ creative_id: creativeData.id }));
        adParams.append("status", "PAUSED");
        adParams.append("access_token", config.systemUserToken!);

        const adRes = await fetch(adUrl, { method: "POST", body: adParams });
        const adData = await adRes.json();
        if (adData.error) throw new Error(this.translateError(adData.error.message, adData.error.error_subcode));

        return adData.id;
    },

    /**
     * Step 6: Activate Ad / Campaign
     */
    async activateCampaign(campaignId: string): Promise<boolean> {
        const config = await this.getConfig();
        const url = `https://graph.facebook.com/v19.0/${campaignId}`;

        const params = new URLSearchParams();
        params.append("status", "ACTIVE");
        params.append("access_token", config.systemUserToken!);

        const res = await fetch(url, { method: "POST", body: params });
        const data = await res.json();

        if (data.error) throw new Error(this.translateError(data.error.message, data.error.error_subcode));
        return true;
    }
};
