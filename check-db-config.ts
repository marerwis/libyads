import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    try {
        const config = await prisma.metaSetting.findFirst();
        console.log("----- CURRENT DB CONFIGURATION -----");
        if (config) {
            console.log("ID:", config.id);
            console.log("Ad Account ID:", config.adAccountId);
            console.log("Business ID:", config.businessId);
            console.log("System User Token:", config.systemUserToken ? config.systemUserToken.substring(0, 15) + "..." : "NULL");
        } else {
            console.log("NO CONFIGURATION FOUND in MetaSetting table.");
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
