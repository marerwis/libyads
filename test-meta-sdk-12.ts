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
        const pageId = page?.pageId || "807487309123252";
        const postId = "807490072456309";

        console.log("Creating campaign...");
        const campaign = await (new AdAccount(`act_${config.adAccountId}`)).createCampaign(
            [],
            {
                name: "Test AWARENESS",
                objective: 'OUTCOME_AWARENESS',
                status: 'PAUSED',
                special_ad_categories: [],
                is_adset_budget_sharing_enabled: false,
            }
        );

        console.log("Creating AdSet...");
        try {
            const adSet = await (new AdAccount(`act_${config.adAccountId}`)).createAdSet(
                [],
                {
                    name: `AdSet awr`,
                    campaign_id: campaign.id,
                    daily_budget: 500,
                    start_time: new Date().toISOString(),
                    end_time: new Date(Date.now() + 2 * 86400000).toISOString(),
                    billing_event: 'IMPRESSIONS',
                    optimization_goal: 'REACH',
                    promoted_object: { page_id: pageId }, // optional but usually okay
                    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
                    targeting: { geo_locations: { countries: ["US"] } },
                    status: 'PAUSED'
                }
            );
            console.log("SUCCESS AdSet:", adSet.id);

            const account = new AdAccount(`act_${config.adAccountId}`);
            const creative = await account.createAdCreative(
                [],
                {
                    name: `Creative for Post ${postId}`,
                    object_story_id: `${pageId}_${postId}`
                }
            );
            console.log("SUCCESS Creative:", creative.id);

            const ad = await account.createAd(
                [],
                {
                    name: `Ad for Post`,
                    adset_id: adSet.id,
                    creative: { creative_id: creative.id },
                    status: 'PAUSED'
                }
            );
            console.log("SUCCESS Ad:", ad.id);

        } catch (e: any) {
            console.error("\n--- E.RESPONSE ---");
            console.dir(e.response, { depth: null });
        }

    } catch (e: any) {
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
