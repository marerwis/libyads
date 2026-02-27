import { prisma } from "@/lib/prisma";
import { metaService } from "@/lib/metaService";

const bizSdk = require('facebook-nodejs-business-sdk');
const AdAccount = bizSdk.AdAccount;
const FacebookAdsApi = bizSdk.FacebookAdsApi;

async function runTest() {
    try {
        const config = await metaService.getConfig();
        const api = bizSdk.FacebookAdsApi.init(config.systemUserToken);

        // Fetch the REAL page ID from DB
        const page = await prisma.facebookPage.findFirst();
        if (!page) {
            console.log("No Facebook Page exists in DB!");
            return;
        }

        const pageId = page.pageId;
        console.log("Found Page in DB:", pageId, page.pageName);

        FacebookAdsApi.init(config.systemUserToken);

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
        console.log("Campaign created:", campaign.id);

        try {
            const adSetId = await metaService.createAdSet(campaign.id, 5, 2, pageId);
            console.log("AdSet created:", adSetId);
        } catch (e: any) {
            console.error("ADSET CREATION RAW ERROR:", e);
        }

    } catch (e: any) {
        console.error("General Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
