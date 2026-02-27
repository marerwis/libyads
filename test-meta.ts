import { prisma } from "./lib/prisma";
import { metaService } from "./lib/metaService";

async function runTest() {
    try {
        console.log("Fetching first configured page...");
        const page = await prisma.facebookPage.findFirst();
        if (!page) {
            console.log("No page found in DB.");
            return;
        }

        console.log("Fetching latest post from Facebook Graph API...");
        const config = await metaService.getConfig();
        const postsUrl = `https://graph.facebook.com/v19.0/${page.pageId}/posts?access_token=${page.pageAccessToken}&limit=1`;
        const postsRes = await fetch(postsUrl);
        const postsData = await postsRes.json();

        const post = postsData.data[0];
        const postId = post.id.includes('_') ? post.id.split('_')[1] : post.id;
        const finalStoryId = `${page.pageId}_${postId}`;

        console.log("1. Creating dummy campaign...");
        const campaignId = await metaService.createCampaign("Test Promo Full Flow");
        console.log("Campaign created! ID:", campaignId);

        console.log("2. Creating AdSet...");
        const durationDays = 3;
        const budget = 5;
        const adSetId = await metaService.createAdSet(campaignId, budget / durationDays, durationDays);
        console.log("AdSet created! ID:", adSetId);

        console.log("3. Creating AdCreative (Multiple Attempts)...");
        const creativeUrl = `https://graph.facebook.com/v19.0/act_${config.adAccountId}/adcreatives`;

        let creativeId = null;

        const attempts = [
            {
                name: "Attempt 1: object_story_spec with page_id",
                params: {
                    name: `Creative for Post ${postId}`,
                    object_story_spec: JSON.stringify({ page_id: page.pageId }),
                    object_story_id: finalStoryId
                }
            },
            {
                name: "Attempt 2: Just object_story_id",
                params: {
                    name: `Creative for Post ${postId}`,
                    object_story_id: finalStoryId
                }
            },
            {
                name: "Attempt 3: degrees_of_freedom_spec",
                params: {
                    name: `Creative for Post ${postId}`,
                    object_story_id: finalStoryId,
                    degrees_of_freedom_spec: JSON.stringify({
                        creative_features_spec: { standard_enhancements: { enrollment_status: "OPT_OUT" } }
                    })
                }
            },
            {
                name: "Attempt 4: Using page_id at root",
                params: {
                    name: `Creative for Post ${postId}`,
                    object_story_id: finalStoryId,
                    page_id: page.pageId
                }
            },
            {
                name: "Attempt 5: Source Instagram Media ID (null)",
                params: {
                    name: `Creative for Post ${postId}`,
                    object_story_id: finalStoryId,
                    source_instagram_media_id: ""
                }
            },
            {
                name: "Attempt 6: Try creating link ad instead",
                params: {
                    name: `Link Ad Creative`,
                    object_story_spec: JSON.stringify({
                        page_id: page.pageId,
                        link_data: {
                            link: "https://google.com",
                            message: "Test message"
                        }
                    })
                }
            }
        ];

        for (const attempt of attempts) {
            console.log(`\nTesting ${attempt.name}...`);
            const p = new URLSearchParams();
            for (const [k, v] of Object.entries(attempt.params)) {
                if (v) p.append(k, v as string);
            }
            p.append("access_token", config.systemUserToken!);

            const res = await fetch(creativeUrl, { method: "POST", body: p });
            const data = await res.json();

            if (data.error) {
                console.error(`Failed ${attempt.name}:`, data.error.message || JSON.stringify(data.error));
            } else {
                console.log(`SUCCESS ${attempt.name}! Creative ID:`, data.id);
                creativeId = data.id;
                break; // Stop at first success
            }
        }

        if (!creativeId) {
            console.error("\nAll attempts to create AdCreative failed. Check Meta Account permissions.");
            return;
        }

        console.log("Creative created! ID:", creativeId);

        console.log("Cleaning up... (Skipped actual deletion for simplicity)");

    } catch (e: any) {
        console.error("Meta API Failed:");
        console.error(e.message);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
