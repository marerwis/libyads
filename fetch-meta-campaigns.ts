import { prisma } from "@/lib/prisma";
import { metaService } from "@/lib/metaService";

const bizSdk = require('facebook-nodejs-business-sdk');
const AdAccount = bizSdk.AdAccount;
const FacebookAdsApi = bizSdk.FacebookAdsApi;

async function runTest() {
    try {
        const config = await metaService.getConfig();
        FacebookAdsApi.init(config.systemUserToken);

        const account = new AdAccount(`act_${config.adAccountId}`);
        const campaigns = await account.getCampaigns(['name', 'status', 'objective', 'created_time'], { limit: 20 });

        console.log(`\n✅ Found ${campaigns.length} campaigns directly from Meta servers!`);
        campaigns.forEach((camp: any) => {
            console.log(`- ID: ${camp.id} | Name: ${camp.name.padEnd(20)} | Status: ${camp.status.padEnd(8)} | Objective: ${camp.objective}`);
        });

    } catch (e: any) {
        console.error("Failed:", e.message || e);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
