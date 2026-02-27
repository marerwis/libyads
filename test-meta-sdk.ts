import { prisma } from "@/lib/prisma";
import { metaService } from "@/lib/metaService";

const bizSdk = require('facebook-nodejs-business-sdk');
const AdAccount = bizSdk.AdAccount;
const FacebookAdsApi = bizSdk.FacebookAdsApi;

async function runTest() {
    try {
        console.log("Fetching config...");
        const config = await metaService.getConfig();
        console.log("Ad Account ID:", config.adAccountId);

        FacebookAdsApi.init(config.systemUserToken);
        const api = bizSdk.FacebookAdsApi.init(config.systemUserToken);
        api.setDebug(true);

        const pageId = "122119131644177651"; // from real-test-flow.js
        const postId = "122143003058177651";

        console.log("1. Creating campaign...");
        let campaign;
        try {
            campaign = await (new AdAccount(`act_${config.adAccountId}`)).createCampaign(
                [],
                {
                    name: "Test Campaign",
                    objective: 'OUTCOME_ENGAGEMENT',
                    status: 'PAUSED',
                    special_ad_categories: [],
                    is_adset_budget_sharing_enabled: false,
                }
            );
            console.log("Campaign created:", campaign.id);
        } catch (e: any) {
            console.error("CAMPAIGN CREATION RAW ERROR:");
            if (e.response && e.response.error) {
                console.error(JSON.stringify(e.response.error, null, 2));
            } else {
                console.error(e);
            }
            return;
        }

        console.log("2. Creating AdSet...");
        let adSetId;
        try {
            adSetId = await metaService.createAdSet(campaign.id, 5, 2, pageId);
            console.log("AdSet created:", adSetId);
        } catch (e: any) {
            console.error("ADSET CREATION ERROR:");
            console.error(e);
        }

    } catch (e: any) {
        console.error("General Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
