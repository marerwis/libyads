import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTest() {
    try {
        const config = await prisma.metaSetting.findFirst();
        if (!config) return;

        console.log(`Querying Facebook for Ad Account: act_${config.adAccountId}`);
        const url = `https://graph.facebook.com/v19.0/act_${config.adAccountId}?fields=name,account_status,business&access_token=${config.systemUserToken}`;

        const res = await fetch(url);
        const data = await res.json();

        console.log("Facebook Response:", JSON.stringify(data, null, 2));

    } catch (e: any) {
        console.error("Failed:", e.message || e);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
