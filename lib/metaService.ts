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
    async createCampaign(name: string, objective: string = 'OUTCOME_AWARENESS'): Promise<string> {
        const config = await this.getConfig();
        FacebookAdsApi.init(config.systemUserToken!);

        try {
            const campaign = await (new AdAccount(`act_${config.adAccountId}`)).createCampaign(
                [],
                {
                    name: name,
                    objective: objective,
                    status: 'PAUSED',
                    special_ad_categories: [],
                    is_adset_budget_sharing_enabled: false,
                }
            );
            return campaign.id;
        } catch (error: any) {
            const metaErr = error.response?.error;
            let details = "";
            if (metaErr) {
                details = `\n[تفاصيل فيسبوك التقنية: ${metaErr.error_user_msg || metaErr.message || JSON.stringify(metaErr)}]`;
            }
            throw new Error(this.translateError(error.message || metaErr?.message, metaErr?.error_subcode) + details);
        }
    },

    /**
     * Step 4: Create Ad Set with Advanced Targeting
     */
    async createAdSet(campaignId: string, dailyBudget: number, durationDays: number, pageId: string, targetingOptions?: { minAge?: number, maxAge?: number, genders?: number[], countries?: string[] }): Promise<string> {
        const config = await this.getConfig();
        FacebookAdsApi.init(config.systemUserToken!);

        const budgetInMinorUnits = Math.round(dailyBudget * 100);
        const now = new Date();
        // Add 1 hour buffer to avoid "Campaign Schedule Is Too Short" errors from Facebook
        const endTime = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000 + 3600000);

        // Process targeting: separate country codes from region names
        const providedLocations = targetingOptions?.countries || ["LY"];
        const countryCodes = providedLocations.filter(loc => loc.length === 2); // e.g. "LY"
        const regionNames = providedLocations.filter(loc => loc.length > 2); // e.g. "BENGHAZI", "TRIPOLI"

        const targetingPayload: any = {
            geo_locations: {}
        };

        if (countryCodes.length > 0) {
            targetingPayload.geo_locations.countries = countryCodes;
        }

        if (regionNames.length > 0) {
            console.log(`[API] Resolving Facebook Meta geolocation keys for: ${regionNames.join(', ')}`);
            const regionKeys: { key: string }[] = [];
            const cityKeys: { key: string }[] = [];

            for (const name of regionNames) {
                try {
                    // Replace underscores with spaces (e.g. "JABAL_AKHDAR" -> "JABAL AKHDAR")
                    const cleanName = name.replace(/_/g, ' ');
                    const url = `https://graph.facebook.com/v19.0/search?type=adgeolocation&q=${encodeURIComponent(cleanName)}&location_types=['city','region']&access_token=${config.systemUserToken}`;

                    const res = await fetch(url);
                    const data = await res.json();

                    if (data.data && data.data.length > 0) {
                        // Attempt to strictly match places within Libya
                        const lyMatches = data.data.filter((d: any) => d.country_code === 'LY');
                        const match = lyMatches.length > 0 ? lyMatches[0] : data.data[0];

                        if (match.type === 'city') {
                            cityKeys.push({ key: match.key });
                        } else {
                            regionKeys.push({ key: match.key });
                        }
                    } else {
                        console.warn(`[API] No Facebook geolocation found for "${cleanName}"`);
                    }
                } catch (e) {
                    console.error(`[API] Failed to resolve location key for: ${name}`, e);
                }
            }
            if (regionKeys.length > 0) {
                targetingPayload.geo_locations.regions = regionKeys;
            }
            if (cityKeys.length > 0) {
                targetingPayload.geo_locations.cities = cityKeys;
            }
        }

        // Failsafe if absolutely no geo_locations were resolved
        if (!targetingPayload.geo_locations.countries && !targetingPayload.geo_locations.regions && !targetingPayload.geo_locations.cities) {
            targetingPayload.geo_locations.countries = ["LY"];
        }

        if (targetingOptions?.minAge) targetingPayload.age_min = targetingOptions.minAge;
        if (targetingOptions?.maxAge) targetingPayload.age_max = targetingOptions.maxAge;
        if (targetingOptions?.genders && targetingOptions.genders.length > 0) {
            // Meta expects genders as an array of integers (1 = Male, 2 = Female)
            targetingPayload.genders = targetingOptions.genders;
        }

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
                    optimization_goal: 'REACH',
                    promoted_object: { page_id: pageId },
                    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
                    targeting: targetingPayload,
                    status: 'PAUSED'
                }
            );
            return adSet.id;
        } catch (error: any) {
            const metaErr = error.response?.error;
            let details = "";
            if (metaErr) {
                details = `\n[تفاصيل فيسبوك التقنية: ${metaErr.error_user_msg || metaErr.message || JSON.stringify(metaErr)}]`;
            }
            throw new Error(this.translateError(error.message || metaErr?.message, metaErr?.error_subcode) + details);
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
            const metaErr = error.response?.error;
            let details = "";
            if (metaErr) {
                details = `\n[تفاصيل فيسبوك التقنية: ${metaErr.error_user_msg || metaErr.message || JSON.stringify(metaErr)}]`;
            }
            throw new Error(this.translateError(error.message || metaErr?.message, metaErr?.error_subcode) + details);
        }
    },

    /**
     * Upload an Image to Meta
     */
    async uploadAdImage(base64Image: string): Promise<string> {
        const config = await this.getConfig();

        const formData = new FormData();
        const buffer = Buffer.from(base64Image, 'base64');
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        formData.append('filename', blob, 'ad_image.jpg');
        formData.append('access_token', config.systemUserToken!);

        try {
            const response = await fetch(`https://graph.facebook.com/v19.0/act_${config.adAccountId}/adimages`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.error) {
                console.error("Facebook Image Upload Error:", data.error);
                throw new Error(data.error.message);
            }
            return data.images["ad_image.jpg"].hash;
        } catch (error: any) {
            console.error("Image Upload Exception:", error);
            throw new Error(this.translateError(error.message));
        }
    },

    /**
     * Create Ad (New Custom Creative)
     */
    async createNewCustomAd(adSetId: string, pageId: string, imageHash: string, primaryText: string, headline: string): Promise<string> {
        const config = await this.getConfig();
        FacebookAdsApi.init(config.systemUserToken!);

        try {
            const account = new AdAccount(`act_${config.adAccountId}`);
            const creative = await account.createAdCreative(
                [],
                {
                    name: `Custom Creative ${Date.now()}`,
                    object_story_spec: {
                        page_id: pageId,
                        link_data: {
                            image_hash: imageHash,
                            link: `https://facebook.com/${pageId}`,
                            message: primaryText,
                            name: headline
                        }
                    }
                }
            );

            const ad = await account.createAd(
                [],
                {
                    name: `Custom Ad ${Date.now()}`,
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
    },

    /**
     * Step 7: Update Campaign Status (Toggle Pause/Resume)
     */
    async updateCampaignStatus(campaignId: string, status: "ACTIVE" | "PAUSED"): Promise<boolean> {
        const config = await this.getConfig();
        FacebookAdsApi.init(config.systemUserToken!);

        try {
            const Campaign = bizSdk.Campaign;
            const campaign = new Campaign(campaignId);
            await campaign.update([], { status });
            return true;
        } catch (error: any) {
            throw new Error(this.translateError(error.message || error.response?.error?.message, error.response?.error?.error_subcode));
        }
    }
};
