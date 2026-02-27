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

        console.log("Trying OUTCOME_TRAFFIC with LINK_CLICKS");
        try {
            const campaign2 = await (new AdAccount(`act_${config.adAccountId}`)).createCampaign(
                [],
                {
                    name: "Test ODAX Traffic Obj",
                    objective: 'OUTCOME_TRAFFIC',
                    status: 'PAUSED',
                    special_ad_categories: [],
                }
            );

            const adSet2 = await (new AdAccount(`act_${config.adAccountId}`)).createAdSet(
                [],
                {
                    name: `AdSet traffic`,
                    campaign_id: campaign2.id,
                    daily_budget: 500,
                    start_time: new Date().toISOString(),
                    end_time: new Date(Date.now() + 86400000).toISOString(),
                    billing_event: 'IMPRESSIONS',
                    optimization_goal: 'LINK_CLICKS',
                    promoted_object: { page_id: page.pageId }, // Do we need this for Traffic?
                    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
                    targeting: { geo_locations: { countries: ["US"] } },
                    status: 'PAUSED'
                }
            );
            console.log("SUCCESS Traffic AdSet:", adSet2.id);
        } catch (e: any) {
            console.error("Traffic AdSet Error:", JSON.stringify(e.response?.error, null, 2));
        }

        console.log("\nTrying OUTCOME_ENGAGEMENT with POST_ENGAGEMENT but NO page_id in promoted_object");
        try {
            const campaign3 = await (new AdAccount(`act_${config.adAccountId}`)).createCampaign(
                [],
                {
                    name: "Test ODAX Engagement Obj",
                    objective: 'OUTCOME_ENGAGEMENT',
                    status: 'PAUSED',
                    special_ad_categories: [],
                }
            );

            const adSet3 = await (new AdAccount(`act_${config.adAccountId}`)).createAdSet(
                [],
                {
                    name: `AdSet eng`,
                    campaign_id: campaign3.id,
                    daily_budget: 500,
                    start_time: new Date().toISOString(),
                    end_time: new Date(Date.now() + 86400000).toISOString(),
                    billing_event: 'IMPRESSIONS',
                    optimization_goal: 'POST_ENGAGEMENT',
                    // NO promoted_object mapping
                    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
                    targeting: { geo_locations: { countries: ["US"] } },
                    status: 'PAUSED'
                }
            );
            console.log("SUCCESS Engagement AdSet without promoted_object:", adSet3.id);
        } catch (e: any) {
            console.error("Engagement AdSet Error:", JSON.stringify(e.response?.error, null, 2));
        }

    } catch (e: any) {
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
