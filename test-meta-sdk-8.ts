import { prisma } from "@/lib/prisma";
import { metaService } from "@/lib/metaService";

const bizSdk = require('facebook-nodejs-business-sdk');
const AdAccount = bizSdk.AdAccount;
const FacebookAdsApi = bizSdk.FacebookAdsApi;

async function runTest() {
    try {
        const config = await metaService.getConfig();
        FacebookAdsApi.init(config.systemUserToken);
        const page = await prisma.facebookPage.findFirst();
        if (!page) return;

        console.log("Creating campaign...");
        const campaign = await (new AdAccount(`act_${config.adAccountId}`)).createCampaign(
            [],
            {
                name: "Test ON_AD Engagement Obj",
                objective: 'OUTCOME_ENGAGEMENT',
                status: 'PAUSED',
                special_ad_categories: [],
                is_adset_budget_sharing_enabled: false,
            }
        );

        console.log("Creating AdSet with ON_AD destination_type...");
        try {
            const adSet = await (new AdAccount(`act_${config.adAccountId}`)).createAdSet(
                [],
                {
                    name: `AdSet eng`,
                    campaign_id: campaign.id,
                    daily_budget: 500,
                    start_time: new Date().toISOString(),
                    end_time: new Date(Date.now() + 86400000).toISOString(),
                    billing_event: 'IMPRESSIONS',
                    optimization_goal: 'POST_ENGAGEMENT',
                    destination_type: 'ON_AD', // Crucial for ODAX Engagement
                    promoted_object: { page_id: page.pageId },
                    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
                    targeting: { geo_locations: { countries: ["US"] } },
                    status: 'PAUSED'
                }
            );
            console.log("SUCCESS Engagement AdSet with ON_AD:", adSet.id);
        } catch (e: any) {
            console.error("\n--- E.RESPONSE ---");
            console.dir(e.response, { depth: null });
        }

    } catch (e: any) {
        console.error("General Error:");
        console.dir(e.response, { depth: null });
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
