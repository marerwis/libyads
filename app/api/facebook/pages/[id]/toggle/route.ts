import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const body = await req.json();
        const { isAutoReplyActive } = body;

        const page = await prisma.facebookPage.findFirst({
            where: { id: params.id, userId: user.id }
        });
        if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

        const updated = await prisma.facebookPage.update({
            where: { id: params.id },
            data: { isAutoReplyActive: Boolean(isAutoReplyActive) }
        });

        // Subscribe or unsubscribe page from Facebook webhook automatically
        if (page.pageAccessToken) {
            try {
                if (isAutoReplyActive) {
                    // Subscribe page to webhook events
                    const subRes = await fetch(
                        `https://graph.facebook.com/v19.0/${page.pageId}/subscribed_apps`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                subscribed_fields: "feed,messages,messaging_postbacks,message_reactions",
                                access_token: page.pageAccessToken
                            })
                        }
                    );
                    const subData = await subRes.json();
                    console.log(`Webhook subscription for page ${page.pageId}:`, JSON.stringify(subData));
                } else {
                    // Unsubscribe page from webhook
                    await fetch(
                        `https://graph.facebook.com/v19.0/${page.pageId}/subscribed_apps?access_token=${page.pageAccessToken}`,
                        { method: "DELETE" }
                    );
                    console.log(`Unsubscribed page ${page.pageId} from webhooks`);
                }
            } catch (webhookErr) {
                console.error("Webhook subscription error:", webhookErr);
                // Don"t fail the toggle if webhook subscription fails
            }
        }

        return NextResponse.json({ ...updated, webhookSubscribed: isAutoReplyActive });
    } catch (error) {
        console.error("Toggle error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}