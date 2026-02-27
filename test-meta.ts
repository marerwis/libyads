import { prisma } from "./lib/prisma";

async function runTest() {
    try {
        console.log("Fetching first configured page...");
        const page = await prisma.facebookPage.findFirst();
        if (!page) {
            console.log("No page found in DB.");
            return;
        }

        const access_token = 'EAAMzyveD87IBQ45RB6bTYElh8XZA27ll76qptvME4GRPsaoNvjqXNDJRwzCX3neieP3tD6LRd1ZCjhfbzYmNnjDVj12TyYwgqT8n0MnFHey9Iq7ekYG56cmYZCNB3aG6B6mGwdf8k5PMI5C0WGia8cdX4RlE1PZBB4jNQLrudwIfTwGJmbBi9Ybz3wWGlcYyruyrmZAg0dEUdNi9mvriP';
        const ad_account_id = '781647312723816';

        console.log("Fetching latest post from Facebook Graph API...");
        const postsUrl = `https://graph.facebook.com/v19.0/${page.pageId}/posts?access_token=${page.pageAccessToken}&limit=1`;
        const postsRes = await fetch(postsUrl);
        const postsData = await postsRes.json();

        const post = postsData.data[0];
        const postId = post.id.includes('_') ? post.id.split('_')[1] : post.id;
        const finalStoryId = `${page.pageId}_${postId}`;

        console.log("1. Creating dummy campaign...");
        const campaignUrl = `https://graph.facebook.com/v19.0/act_${ad_account_id}/campaigns`;
        const campaignParams = new URLSearchParams({
            name: "Test Promo Full Flow Real",
            objective: "OUTCOME_ENGAGEMENT",
            status: "PAUSED",
            special_ad_categories: "[]",
            is_adset_budget_sharing_enabled: "false",
            access_token
        });
        const campaignRes = await fetch(campaignUrl, { method: "POST", body: campaignParams });
        const campaignData = await campaignRes.json();

        if (campaignData.error) throw new Error("Campaign Error: " + JSON.stringify(campaignData.error));
        const campaignId = campaignData.id;
        console.log("Campaign created! ID:", campaignId);

        console.log("2. Creating AdSet...");
        const adSetUrl = `https://graph.facebook.com/v19.0/act_${ad_account_id}/adsets`;
        const now = new Date();
        const endTime = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const adSetParams = new URLSearchParams({
            name: `AdSet for ${campaignId}`,
            campaign_id: campaignId,
            daily_budget: "500",
            start_time: now.toISOString(),
            end_time: endTime.toISOString(),
            billing_event: "IMPRESSIONS",
            optimization_goal: "POST_ENGAGEMENT",
            bid_strategy: "LOWEST_COST_WITHOUT_CAP",
            targeting: JSON.stringify({ geo_locations: { countries: ["US"] } }),
            status: "PAUSED",
            access_token
        });

        const adSetRes = await fetch(adSetUrl, { method: "POST", body: adSetParams });
        const adSetData = await adSetRes.json();
        if (adSetData.error) throw new Error("AdSet Error: " + JSON.stringify(adSetData.error));
        const adSetId = adSetData.id;
        console.log("AdSet created! ID:", adSetId);

        console.log("3. Creating AdCreative...");
        const creativeUrl = `https://graph.facebook.com/v19.0/act_${ad_account_id}/adcreatives`;
        const creativeParams = new URLSearchParams({
            name: `Creative for Post ${postId}`,
            object_story_id: finalStoryId,
            access_token
        });

        const creativeRes = await fetch(creativeUrl, { method: "POST", body: creativeParams });
        const creativeData = await creativeRes.json();

        if (creativeData.error) {
            console.error("RAW FB CREATIVE ERROR:", JSON.stringify(creativeData.error, null, 2));
            return;
        }

        console.log("Creative created! ID:", creativeData.id);

    } catch (e: any) {
        console.error("Meta API Failed:");
        console.error(e.message);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
