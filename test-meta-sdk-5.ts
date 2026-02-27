import { prisma } from "@/lib/prisma";
import { metaService } from "@/lib/metaService";

const bizSdk = require('facebook-nodejs-business-sdk');
const AdAccount = bizSdk.AdAccount;
const FacebookAdsApi = bizSdk.FacebookAdsApi;

async function runTest() {
    try {
        const config = await metaService.getConfig();
        const api = bizSdk.FacebookAdsApi.init(config.systemUserToken);
        api.setDebug(false);

        const page = await prisma.facebookPage.findFirst();
        if (!page) return;
        const pageId = page.pageId;

        console.log("Trying Campaign Objective: POST_ENGAGEMENT");
        try {
            const campaign = await (new AdAccount(`act_${config.adAccountId}`)).createCampaign(
                [],
                {
                    name: "Test Legacy POST_ENGAGEMENT Obj",
                    objective: 'POST_ENGAGEMENT', // Non-ODAX legacy objective
                    status: 'PAUSED',
                    special_ad_categories: [],
                }
            );

            console.log("Campaign created:", campaign.id);

            const adSet = await (new AdAccount(`act_${config.adAccountId}`)).createAdSet(
                [],
                {
                    name: `AdSet for ${campaign.id}`,
                    campaign_id: campaign.id,
                    daily_budget: 500,
                    start_time: new Date().toISOString(),
                    end_time: new Date(Date.now() + 86400000).toISOString(),
                    billing_event: 'IMPRESSIONS',
                    optimization_goal: 'POST_ENGAGEMENT',
                    promoted_object: { page_id: pageId },
                    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
                    targeting: { geo_locations: { countries: ["US"] } },
                    status: 'PAUSED'
                }
            );
            console.log("AdSet created:", adSet.id);
            return;
        } catch (e: any) {
            console.error("Failed POST_ENGAGEMENT objective:", e.response?.error?.error_user_msg || e.response?.error?.message);
        }

        console.log("\nTrying Campaign Objective: OUTCOME_TRAFFIC with LINK_CLICKS");
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
            console.log("Campaign created:", campaign2.id);

            const adSet2 = await (new AdAccount(`act_${config.adAccountId}`)).createAdSet(
                [],
                {
                    name: `AdSet for ${campaign2.id}`,
                    campaign_id: campaign2.id,
                    daily_budget: 500,
                    start_time: new Date().toISOString(),
                    end_time: new Date(Date.now() + 86400000).toISOString(),
                    billing_event: 'IMPRESSIONS',
                    optimization_goal: 'LINK_CLICKS',
                    promoted_object: { page_id: pageId },
                    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
                    targeting: { geo_locations: { countries: ["US"] } },
                    status: 'PAUSED'
                }
            );
            console.log("AdSet created:", adSet2.id);
        } catch (e: any) {
            console.error("Failed OUTCOME_TRAFFIC objective:", e.response?.error?.error_user_msg || e.response?.error?.message);
        }

    } catch (e: any) {
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
