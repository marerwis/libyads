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
     * Step 3: Create Campaign
     */
    async createCampaign(name: string): Promise<string> {
        const config = await this.getConfig();
        const url = `https://graph.facebook.com/v19.0/act_${config.adAccountId}/campaigns`;

        // Using URLSearchParams as Meta API expects form-urlencoded data for most endpoints
        const params = new URLSearchParams();
        params.append("name", name);
        params.append("objective", "OUTCOME_ENGAGEMENT"); // Required in newer Meta APIs for Post Engagement
        params.append("status", "PAUSED");
        params.append("special_ad_categories", "[]");
        params.append("access_token", config.systemUserToken!);

        const res = await fetch(url, { method: "POST", body: params });
        const data = await res.json();

        if (data.error) throw new Error(`Meta API Campaign Error: ${data.error.message}`);
        return data.id; // Returns Campaign ID
    },

    /**
     * Step 4: Create Ad Set
     */
    async createAdSet(campaignId: string, dailyBudget: number, durationDays: number): Promise<string> {
        const config = await this.getConfig();
        const url = `https://graph.facebook.com/v19.0/act_${config.adAccountId}/adsets`;

        // Meta expects budget in cents/minor units (e.g., $10 = 1000)
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
        // Basic broad targeting required by Meta
        params.append("targeting", JSON.stringify({ geo_locations: { countries: ["US"] } }));
        params.append("status", "PAUSED");
        params.append("access_token", config.systemUserToken!);

        const res = await fetch(url, { method: "POST", body: params });
        const data = await res.json();

        if (data.error) throw new Error(`Meta API AdSet Error: ${data.error.message}`);
        return data.id; // Returns AdSet ID
    },

    /**
     * Step 5: Create Ad (using existing Post)
     */
    async createAd(adSetId: string, pageId: string, postId: string): Promise<string> {
        const config = await this.getConfig();

        // First, create an Ad Creative tied to the specific page post
        const creativeUrl = `https://graph.facebook.com/v19.0/act_${config.adAccountId}/adcreatives`;
        const creativeParams = new URLSearchParams();
        creativeParams.append("name", `Creative for Post ${postId}`);
        creativeParams.append("object_story_id", `${pageId}_${postId}`);
        // creativeParams.append("page_id", pageId);
        creativeParams.append("access_token", config.systemUserToken!);

        const creativeRes = await fetch(creativeUrl, { method: "POST", body: creativeParams });
        const creativeData = await creativeRes.json();
        if (creativeData.error) throw new Error(`Meta API Creative Error: ${creativeData.error.message}`);

        // Second, create the actual Ad linking the AdSet and the Creative
        const adUrl = `https://graph.facebook.com/v19.0/act_${config.adAccountId}/ads`;
        const adParams = new URLSearchParams();
        adParams.append("name", `Ad for Post ${postId}`);
        adParams.append("adset_id", adSetId);
        adParams.append("creative", JSON.stringify({ creative_id: creativeData.id }));
        adParams.append("status", "PAUSED");
        adParams.append("access_token", config.systemUserToken!);

        const adRes = await fetch(adUrl, { method: "POST", body: adParams });
        const adData = await adRes.json();
        if (adData.error) throw new Error(`Meta API Ad Error: ${adData.error.message}`);

        return adData.id; // Returns Ad ID
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

        if (data.error) throw new Error(`Meta API Activation Error: ${data.error.message}`);
        return true;
    }
};
