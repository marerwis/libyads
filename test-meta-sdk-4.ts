import { prisma } from "@/lib/prisma";
import { metaService } from "@/lib/metaService";

const bizSdk = require('facebook-nodejs-business-sdk');
const AdAccount = bizSdk.AdAccount;
const FacebookAdsApi = bizSdk.FacebookAdsApi;

async function runTest() {
    try {
        const config = await metaService.getConfig();
        const api = bizSdk.FacebookAdsApi.init(config.systemUserToken);
        api.setDebug(true);

        const page = await prisma.facebookPage.findFirst();
        if (!page) return;
        const pageId = page.pageId;

        const campaign = await (new AdAccount(`act_${config.adAccountId}`)).createCampaign(
            [],
            {
                name: "Real DB Test Campaign",
                objective: 'OUTCOME_ENGAGEMENT',
                status: 'PAUSED',
                special_ad_categories: [],
                is_adset_budget_sharing_enabled: false,
            }
        );

        const dailyBudget = 5;
        const durationDays = 2;
        const budgetInMinorUnits = Math.round(dailyBudget * 100);
        const now = new Date();
        const endTime = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        try {
            const adSet = await (new AdAccount(`act_${config.adAccountId}`)).createAdSet(
                [],
                {
                    name: `AdSet for ${campaign.id}`,
                    campaign_id: campaign.id,
                    daily_budget: budgetInMinorUnits,
                    start_time: now.toISOString(),
                    end_time: endTime.toISOString(),
                    billing_event: 'IMPRESSIONS',
                    optimization_goal: 'POST_ENGAGEMENT',
                    promoted_object: { page_id: pageId },
                    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
                    targeting: { geo_locations: { countries: ["US"] } },
                    status: 'PAUSED'
                }
            );
            console.log("AdSet created:", adSet.id);
        } catch (e: any) {
            console.error("\n--- FULL RAW E ---");
            console.dir(e, { depth: null });
            console.error("\n--- E.RESPONSE ---");
            console.dir(e.response, { depth: null });
        }

    } catch (e: any) {
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
