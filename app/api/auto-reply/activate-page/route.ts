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

        const { pageId } = await req.json();

        if (!pageId) {
            return NextResponse.json(
                { error: "Missing required field: pageId" },
                { status: 400 },
            );
        }

        // 1. Fetch the Page from DB to ensure it exists and belongs to user
        const pageRecord = await prisma.facebookPage.findFirst({
            where: {
                pageId: pageId,
                userId: session.user.id,
            },
        });

        if (!pageRecord) {
            return NextResponse.json({ error: "Page not found" }, { status: 404 });
        }

        // 2. We need the page access token to subscribe the app to the page
        const pageAccessToken = pageRecord.pageAccessToken;

        if (!pageAccessToken) {
            return NextResponse.json(
                { error: "Page access token is missing. Please reconnect the page." },
                { status: 400 },
            );
        }

        // 3. Call Facebook Graph API to subscribe the App to the Page's Webhooks
        // Subscribing to 'feed' to get comments/posts/messages depending on the needed scopes
        const fbResponse = await fetch(
            `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?subscribed_fields=feed&access_token=${pageAccessToken}`,
            {
                method: "POST",
            },
        );

        const fbData = await fbResponse.json();

        if (fbData.error) {
            console.error(
                "Facebook API Error during subscribed_apps POST request:",
                fbData.error,
            );
            return NextResponse.json(
                {
                    error:
                        fbData.error.message ||
                        "Failed to subscribe App to Facebook Page Webhooks.",
                },
                { status: 400 },
            );
        }

        // 4. Update the Database
        const updatedPage = await prisma.facebookPage.update({
            where: { id: pageRecord.id },
            data: { isAutoReplyActive: true },
        });

        return NextResponse.json({
            success: true,
            message: "Successfully activated auto-replies for the page.",
            page: updatedPage,
        });
    } catch (error) {
        console.error("Failed to activate page for auto-replies:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
