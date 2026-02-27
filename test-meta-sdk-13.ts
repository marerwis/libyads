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
        if (!page) return;
        const pageId = page.pageId;

        // Fetch the REAL latest post ID from this page
        console.log("Fetching real latest post...");
        const postsUrl = `https://graph.facebook.com/v24.0/${pageId}/posts?access_token=${page.pageAccessToken}&limit=1`;
        const postsRes = await fetch(postsUrl);
        const postsData = await postsRes.json();

        if (!postsData.data || postsData.data.length === 0) {
            console.log("No posts found on this page.");
            return;
        }

        const rawPostId = postsData.data[0].id;
        const postId = rawPostId.includes('_') ? rawPostId.split('_')[1] : rawPostId;
        console.log(`Using real Post ID param: ${postId} (Full: ${pageId}_${postId})`);

        console.log("Creating campaign...");
        const campaign = await (new AdAccount(`act_${config.adAccountId}`)).createCampaign(
            [],
            {
                name: "Real Integration AWARENESS",
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
                    promoted_object: { page_id: pageId },
                    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
                    targeting: { geo_locations: { countries: ["US"] } },
                    status: 'PAUSED'
                }
            );
            console.log("SUCCESS AdSet:", adSet.id);

            console.log("Creating Creative...");
            const account = new AdAccount(`act_${config.adAccountId}`);
            const creative = await account.createAdCreative(
                [],
                {
                    name: `Creative for Post ${postId}`,
                    object_story_id: `${pageId}_${postId}`
                }
            );
            console.log("SUCCESS Creative:", creative.id);

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
