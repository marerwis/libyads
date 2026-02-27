import { prisma } from "@/lib/prisma";
const bizSdk = require('facebook-nodejs-business-sdk');
const AdAccount = bizSdk.AdAccount;
const FacebookAdsApi = bizSdk.FacebookAdsApi;


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
        if (lowerMsg.includes("permission") || subcode === 33 || lowerMsg.includes("application does not have")) {
            return "لا توجد صلاحيات كافية للوصول إلى هذا المورد. تأكد من إعطاء (System User) صلاحية إدارة الإعلانات (Manage Ads) للصفحة في مدير الأعمال (Business Manager).";
        }
        if (lowerMsg.includes("unknown error") && errorMsg.length < 30) {
            return "حدث خطأ غير معروف من فيسبوك (Code 1). غالباً يعود السبب إلى عدم منح (System User) صلاحية إنشاء إعلانات للصفحة المحددة، أو أن التطبيق غير مفعل بالكامل.";
        }
        return `خطأ من فيسبوك: ${errorMsg}`;
    },

    /**
     * Step 3: Create Campaign
     */
    async createCampaign(name: string): Promise<string> {
        const config = await this.getConfig();
        FacebookAdsApi.init(config.systemUserToken!);

        try {
            const campaign = await (new AdAccount(`act_${config.adAccountId}`)).createCampaign(
                [],
                {
                    name: name,
                    objective: 'OUTCOME_ENGAGEMENT',
                    status: 'PAUSED',
                    special_ad_categories: [],
                    is_adset_budget_sharing_enabled: false,
                }
            );
            return campaign.id;
        } catch (error: any) {
            throw new Error(this.translateError(error.message || error.response?.error?.message, error.response?.error?.error_subcode));
        }
    },

    /**
     * Step 4: Create Ad Set
     */
    async createAdSet(campaignId: string, dailyBudget: number, durationDays: number): Promise<string> {
        const config = await this.getConfig();
        FacebookAdsApi.init(config.systemUserToken!);

        const budgetInMinorUnits = Math.round(dailyBudget * 100);
        const now = new Date();
        const endTime = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        try {
            const adSet = await (new AdAccount(`act_${config.adAccountId}`)).createAdSet(
                [],
                {
                    name: `AdSet for ${campaignId}`,
                    campaign_id: campaignId,
                    daily_budget: budgetInMinorUnits,
                    start_time: now.toISOString(),
                    end_time: endTime.toISOString(),
                    billing_event: 'IMPRESSIONS',
                    optimization_goal: 'POST_ENGAGEMENT',
                    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
                    targeting: { geo_locations: { countries: ["US"] } },
                    status: 'PAUSED'
                }
            );
            return adSet.id;
        } catch (error: any) {
            throw new Error(this.translateError(error.message || error.response?.error?.message, error.response?.error?.error_subcode));
        }
    },

    /**
     * Step 5: Create Ad (using existing Post)
     */
    async createAd(adSetId: string, pageId: string, postId: string): Promise<string> {
        const config = await this.getConfig();
        FacebookAdsApi.init(config.systemUserToken!);

        let finalStoryId = postId;
        if (!postId.includes("_")) {
            finalStoryId = `${pageId}_${postId}`;
        }

        try {
            const account = new AdAccount(`act_${config.adAccountId}`);
            const creative = await account.createAdCreative(
                [],
                {
                    name: `Creative for Post ${postId}`,
                    object_story_id: finalStoryId
                }
            );

            const ad = await account.createAd(
                [],
                {
                    name: `Ad for Post ${postId}`,
                    adset_id: adSetId,
                    creative: { creative_id: creative.id },
                    status: 'PAUSED'
                }
            );
            return ad.id;
        } catch (error: any) {
            throw new Error(this.translateError(error.message || error.response?.error?.message, error.response?.error?.error_subcode));
        }
    },

    /**
     * Step 6: Activate Ad / Campaign
     */
    async activateCampaign(campaignId: string): Promise<boolean> {
        const config = await this.getConfig();
        FacebookAdsApi.init(config.systemUserToken!);

        try {
            const Campaign = bizSdk.Campaign;
            const campaign = new Campaign(campaignId);
            await campaign.update([], {
                status: 'ACTIVE'
            });
            return true;
        } catch (error: any) {
            throw new Error(this.translateError(error.message || error.response?.error?.message, error.response?.error?.error_subcode));
        }
    }
};
