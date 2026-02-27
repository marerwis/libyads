import { prisma } from "@/lib/prisma";
import { metaService } from "@/lib/metaService";

const bizSdk = require('facebook-nodejs-business-sdk');
const AdAccount = bizSdk.AdAccount;
const FacebookAdsApi = bizSdk.FacebookAdsApi;

async function runTest() {
    try {
        const config = await metaService.getConfig();
        FacebookAdsApi.init(config.systemUserToken);

        const pageId = "122119131644177651"; // user's dummy page 
        const postId = "122143003058177651";

        console.log("Creating campaign...");
        const campaign = await (new AdAccount(`act_${config.adAccountId}`)).createCampaign(
            [],
            {
                name: "Test Traffic Full",
                objective: 'OUTCOME_TRAFFIC',
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
                    name: `AdSet traffic`,
                    campaign_id: campaign.id,
                    daily_budget: 500,
                    start_time: new Date().toISOString(),
                    end_time: new Date(Date.now() + 2 * 86400000).toISOString(), // 2 days
                    billing_event: 'IMPRESSIONS',
                    optimization_goal: 'LINK_CLICKS',
                    destination_type: 'WEBSITE',
                    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
                    targeting: { geo_locations: { countries: ["US"] } },
                    status: 'PAUSED'
                }
            );
            console.log("SUCCESS Traffic AdSet:", adSet.id);

            console.log("Creating Creative...");
            const account = new AdAccount(`act_${config.adAccountId}`);
            const creative = await account.createAdCreative(
                [],
                {
                    name: `Creative for Post ${postId}`,
                    object_story_id: `${pageId}_${postId}`
                }
            );
            console.log('Ad Creative created:', creative.id);

            console.log("Creating Ad...");
            const ad = await account.createAd(
                [],
                {
                    name: `Ad for Post`,
                    adset_id: adSet.id,
                    creative: { creative_id: creative.id },
                    status: 'PAUSED'
                }
            );
            console.log("Ad created:", ad.id);

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
