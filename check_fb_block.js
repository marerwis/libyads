const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBlock() {
    console.log("Fetching Facebook pages from database...");
    const pages = await prisma.facebookPage.findMany();
    
    if (pages.length === 0) {
        console.log("No pages found.");
        return;
    }

    const page = pages[0]; // Let's test the first page
    console.log(`Testing Page: ${page.pageName} (ID: ${page.pageId})`);

    // 1. Fetch latest posts
    console.log("Fetching latest posts to find an ID to comment on...");
    const postsRes = await fetch(`https://graph.facebook.com/v21.0/${page.pageId}/posts?access_token=${page.pageAccessToken}&limit=1`);
    const postsData = await postsRes.json();

    if (!postsData.data || postsData.data.length === 0) {
        console.log("No posts found on this page to test with. Attempting to post a status update instead.");
        // Try posting a status
        const statusRes = await fetch(`https://graph.facebook.com/v21.0/${page.pageId}/feed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "Test message",
                access_token: page.pageAccessToken
            })
        });
        const statusData = await statusRes.json();
        console.log("Status Post Response:", statusData);
        return;
    }

    const postId = postsData.data[0].id;
    console.log(`Found Post ID: ${postId}. Attempting to comment...`);

    // 2. Try to comment
    const commentRes = await fetch(`https://graph.facebook.com/v21.0/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: "مرحبا، هذا اختبار للرد الآلي.",
            access_token: page.pageAccessToken
        })
    });

    const commentData = await commentRes.json();
    console.log("\n--- Facebook API Response ---");
    console.dir(commentData, { depth: null });
    console.log("-----------------------------\n");
    
    if (commentData.error && commentData.error.code === 368) {
        console.log("🚨 STILL BLOCKED: Facebook is still applying the spam block (Error 368).");
    } else if (!commentData.error) {
        console.log("✅ SUCCESS: The block has been lifted! Comment posted successfully.");
    } else {
        console.log("⚠️ OTHER ERROR: ", commentData.error.message);
    }
}

checkBlock().catch(console.error).finally(() => prisma.$disconnect());
