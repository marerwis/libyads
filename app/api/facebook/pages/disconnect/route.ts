import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { pageId } = body;

        if (!pageId) {
            return NextResponse.json(
                { error: "Missing required field: pageId" },
                { status: 400 },
            );
        }

        // Verify the page belongs to the user
        const pageRecord = await prisma.facebookPage.findFirst({
            where: {
                pageId: pageId,
                userId: session.user.id,
            },
        });

        if (!pageRecord) {
            return NextResponse.json(
                { error: "Page not found or does not belong to user" },
                { status: 404 },
            );
        }

        // Fetch global Meta settings for Libya Ads Business Manager credentials
        const metaSettings = await prisma.metaSetting.findFirst();

        if (metaSettings?.businessId && metaSettings?.systemUserToken) {
            const { businessId, systemUserToken } = metaSettings;

            // Unsubscribe from Business Manager Client Pages (Optional, but best practice if supported)
            // Usually Facebook doesn't easily allow DELETE client_pages edge with system user token, 
            // but we can try, or we just remove it locally.
            try {
                await fetch(
                    `https://graph.facebook.com/v19.0/${businessId}/client_pages?page_id=${pageId}&access_token=${systemUserToken}`,
                    {
                        method: "DELETE",
                    },
                );
            } catch (e) {
                console.error("Non-fatal error detaching from BM: ", e);
            }

            // Also deactivate webhooks if applicable
            if ((pageRecord as any).isAutoReplyActive) {
                try {
                    await fetch(
                        `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?access_token=${pageRecord.pageAccessToken}`,
                        { method: "DELETE" }
                    );
                } catch (e) {
                    console.error("Non-fatal error unsubscribing webhook: ", e);
                }
            }
        }

        // Update the page in our database to reset its status
        await prisma.facebookPage.update({
            where: { id: pageRecord.id },
            data: {
                status: "",
                isAutoReplyActive: false,
            } as any
        });

        // Option: You might also want to delete related auto-reply rules,
        // but Prisma's `onDelete: Cascade` usually handles related records if configured properly.
        // In our schema, AutoReplyRule doesn't have a strict foreign key to FacebookPage, it just stores pageId string. 
        // We will clean them up manually here to be safe:
        await prisma.autoReplyRule.deleteMany({
            where: {
                pageId: pageRecord.id, // Or pageRecord.pageId depending on what you store in rule
            }
        })

        return NextResponse.json({
            success: true,
            message: "Page disconnected successfully.",
        });
    } catch (error) {
        console.error("Failed to disconnect Business Manager page:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
