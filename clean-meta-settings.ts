import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean() {
    try {
        const allSettings = await prisma.metaSetting.findMany({
            orderBy: { updatedAt: 'desc' }
        });

        console.log(`Found ${allSettings.length} MetaSetting rows.`);

        if (allSettings.length > 1) {
            const keep = allSettings[0];
            console.log("Keeping newest row:", keep.id, "with AdAccountId:", keep.adAccountId);

            const toDelete = allSettings.slice(1).map(s => s.id);
            console.log("Deleting older rows...", toDelete);

            await prisma.metaSetting.deleteMany({
                where: { id: { in: toDelete } }
            });
            console.log("Cleanup complete!");
        } else {
            console.log("No duplicates found.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

clean();
