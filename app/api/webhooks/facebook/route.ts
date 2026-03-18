import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Use a secure token that should be matched in Facebook App Settings
const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || "libyads_webhook_verify_secure_123";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    // Check if a request is from Facebook
    if (mode && token) {
        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            console.log("WEBHOOK_VERIFIED");
            return new NextResponse(challenge, { status: 200 });
        } else {
            return new NextResponse("Forbidden", { status: 403 });
        }
    }

    // For direct browser access or health check
    return new NextResponse("Webhook is running. Please configure in Facebook App Settings.", { status: 200 });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Check if this is an event from a page subscription
        if (body.object === "page") {
            // Iterate over each entry (there may be multiple if batched)
            for (const entry of body.entry) {
                const pageId = entry.id;

                // Iterate over each messaging/changes event
                for (const change of entry.changes || []) {
                    if (change.field === "feed") {
                        const value = change.value;

                        // We only care about new comments
                        if (value.item === "comment" && value.verb === "add") {
                            const postId = value.post_id;
                            const commentId = value.comment_id;
                            const message = value.message?.toLowerCase() || "";

                            // Prevent crashing if 'from' is missing
                            if (!value.from) continue;

                            const senderId = value.from.id;
                            const senderName = value.from.name;

                            // Prevent infinite loops (don't reply to our own replies)
                            if (senderId === pageId) continue;

                            // Extract just the raw post ID (it usually comes as pageId_postId)
                            const extractedPostId = postId.includes('_') ? postId.split('_')[1] : postId;

                            // Find a matching active AutoReplyRule (Post-Level)
                            let rule: any = await prisma.autoReplyRule.findFirst({
                                where: {
                                    pageId: pageId,
                                    postId: extractedPostId,
                                    isActive: true
                                }
                            });

                            let isPageRule = false;

                            if (!rule) {
                                // If no post-level rule, check for a Page-Level rule
                                rule = await prisma.pageAutoReplyRule.findFirst({
                                    where: {
                                        pageId: pageId,
                                        isActive: true
                                    }
                                });

                                if (!rule) continue; // No rule configured for this post or page
                                isPageRule = true;
                            }

                            // Check if the rule has expired based on activeDays
                            const expirationDate = new Date(rule.createdAt);
                            expirationDate.setDate(expirationDate.getDate() + rule.activeDays);
                            if (new Date() > expirationDate) {
                                console.log(`Rule for ${isPageRule ? 'page' : 'post'} ${isPageRule ? pageId : extractedPostId} has expired. Expiration date: ${expirationDate}`);
                                continue;
                            }

                            // Check keywords if applicable (only for Post-Level rules currently)
                            if (!isPageRule && rule.keywords) {
                                const keywordList = rule.keywords.split(',').map((k: string) => k.trim().toLowerCase()).filter((k: string) => k);
                                if (keywordList.length > 0) {
                                    const hasMatch = keywordList.some((kw: string) => message.includes(kw));
                                    if (!hasMatch) continue; // Didn't match any keyword
                                }
                            }

                            // Fetch system config to check if globally enabled and get the price
                            const sysConfig = await prisma.systemSetting.findFirst();
                            if (!sysConfig?.autoReplyEnabled) continue; // Feature globally disabled
                            const replyPrice = isPageRule ? (sysConfig.pageAutoReplyPrice || 0) : (sysConfig.autoReplyPrice || 0);

                            // Fetch user's wallet to check balance
                            const userWallet = await prisma.wallet.findUnique({
                                where: { userId: rule.userId }
                            });

                            if (!userWallet || userWallet.balance < replyPrice) {
                                console.log(`Insufficient balance for user ${rule.userId} to auto-reply.`);
                                continue; // Too poor to reply
                            }

                            // Fetch page access token to make the API call
                            const page = await prisma.facebookPage.findFirst({
                                where: { pageId: pageId, userId: rule.userId }
                            });

                            if (!page || !page.pageAccessToken) {
                                console.log(`Missing page access token for page ${pageId}`);
                                continue;
                            }

                            // Construct reply message
                            // If it's a page rule, randomly select one of the reply variants
                            let selectedReplyText = "";
                            if (isPageRule && rule.replyTexts && rule.replyTexts.length > 0) {
                                const randomIndex = Math.floor(Math.random() * rule.replyTexts.length);
                                selectedReplyText = rule.replyTexts[randomIndex];
                            } else {
                                selectedReplyText = rule.replyText;
                            }

                            // Note: Facebook Graph API currently restricts explicit @mentions for pages replying to users
                            // so we fall back to just using their name text.
                            const replyMessage = rule.includeName
                                ? `${senderName}، ${selectedReplyText}`
                                : selectedReplyText;

                            // Send Reply via Facebook Graph API
                            const fbResponse = await fetch(`https://graph.facebook.com/v19.0/${commentId}/comments`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    message: replyMessage,
                                    access_token: page.pageAccessToken
                                })
                            });

                            const fbResult = await fbResponse.json();

                            if (fbResponse.ok && fbResult.id) {
                                // Send Private Message if configured
                                if (rule.privateMessage) {
                                    const pmMessageResponse = await fetch(`https://graph.facebook.com/v19.0/${pageId}/messages`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            recipient: { comment_id: commentId },
                                            message: { text: rule.privateMessage },
                                            access_token: page.pageAccessToken
                                        })
                                    });

                                    const pmResult = await pmMessageResponse.json();
                                    if (pmMessageResponse.ok) {
                                        console.log(`Successfully sent Private Message for comment ${commentId}`);
                                    } else {
                                        console.error(`Failed to send Private Message:`, pmResult);
                                    }
                                }

                                // Automatically Like the comment
                                const likeResponse = await fetch(`https://graph.facebook.com/v19.0/${commentId}/likes`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        access_token: page.pageAccessToken
                                    })
                                });

                                if (likeResponse.ok) {
                                    console.log(`Successfully liked comment ${commentId}`);
                                } else {
                                    console.error(`Failed to like comment ${commentId}:`, await likeResponse.json());
                                }

                                // Deduct balance if the reply was successful
                                if (replyPrice > 0) {
                                    await prisma.$transaction([
                                        prisma.wallet.update({
                                            where: { id: userWallet.id },
                                            data: { balance: { decrement: replyPrice } }
                                        }),
                                        prisma.walletTransaction.create({
                                            data: {
                                                amount: -replyPrice,
                                                type: "DEDUCTION",
                                                description: `Auto-reply (${isPageRule ? 'Page-Level' : 'Post-Level'}) to comment on post ${extractedPostId}`,
                                                userId: rule.userId
                                            }
                                        })
                                    ]);
                                }
                                console.log(`Successfully auto-replied to comment ${commentId}`);
                            } else {
                                console.error(`Failed to auto-reply to Facebook:`, fbResult);
                            }
                        }
                    }
                }
            }
            return new NextResponse("EVENT_RECEIVED", { status: 200 });
        } else {
            return new NextResponse("Not Found", { status: 404 });
        }
    } catch (error) {
        console.error("Webhook processing error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
