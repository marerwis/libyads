import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllCampaigns() {
  console.log("Fetching all campaigns from Database...");
  const campaigns = await prisma.campaign.findMany({
    include: { user: true }
  });

  if (campaigns.length === 0) {
    console.log("No campaigns found in the database. Nothing to delete.");
    return;
  }

  console.log(`Found ${campaigns.length} campaigns. Beginning deletion...`);

  // We need to group by user because we need page access tokens to delete campaigns on Meta API.
  // Actually, we use system-level access token or the user's access token?
  // Let's get the Facebook page tokens.
  
  for (const campaign of campaigns) {
    console.log(`Processing campaign DB ID: ${campaign.id}, Meta ID: ${campaign.campaignId}`);
    
    if (campaign.campaignId) {
        // Find the page to get the access token if needed, or query for the token directly.
        // The Meta Graph API uses System User tokens or Page tokens. We need to fetch the system token.
        const metaSetting = await prisma.metaSetting.findFirst();
        const accessToken = metaSetting?.systemUserToken;

        if (accessToken) {
            try {
                // Delete from Meta
                console.log(`Sending DELETE request to Meta for campaign ${campaign.campaignId}`);
                const res = await fetch(`https://graph.facebook.com/v19.0/${campaign.campaignId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ access_token: accessToken })
                });
                
                const data = await res.json();
                if (res.ok && data.success) {
                    console.log(`Successfully deleted campaign ${campaign.campaignId} from Meta.`);
                } else {
                    console.error(`Meta API Error for ${campaign.campaignId}:`, data);
                }
            } catch (error) {
                console.error(`Network error while deleting ${campaign.campaignId} from Meta:`, error);
            }
        } else {
            console.warn("No systemUserToken found in MetaSetting. Skipping Meta deletion.");
        }
    } else {
        console.log(`Campaign ${campaign.id} doesn't have a Meta Campaign ID. Skipping Meta deletion.`);
    }

    // Delete from Database
    await prisma.campaign.delete({
        where: { id: campaign.id }
    });
    console.log(`Deleted campaign ${campaign.id} from Local Database.\n`);
  }

  console.log("Finished mass deletion.");
}

deleteAllCampaigns()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
