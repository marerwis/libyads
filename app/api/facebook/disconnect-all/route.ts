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

        // Fetch user's pages to potentially unsubscribe webhooks if needed
        const userPages = await prisma.facebookPage.findMany({
            where: { userId: session.user.id }
        });

        // Optionally, if we wanted to be perfectly clean, we'd unsubscribe webhooks for each page here.
        // For now, we'll just delete the records to "Disconnect" the account locally.
        for (const page of userPages) {
            if ((page as any).isAutoReplyActive) {
                try {
                    await fetch(
                        `https://graph.facebook.com/v19.0/${page.pageId}/subscribed_apps?access_token=${page.pageAccessToken}`,
                        { method: "DELETE" }
                    );
                } catch (e) {
                    console.error("Non-fatal error unsubscribing webhook during disconnect all: ", e);
                }
            }
        }

        // Delete all pages associated with the user
        await prisma.facebookPage.deleteMany({
            where: { userId: session.user.id }
        });

        // Also delete any auto reply rules associated with the user to keep database clean
        await prisma.autoReplyRule.deleteMany({
            where: { userId: session.user.id }
        });

        return NextResponse.json({
            success: true,
            message: "All Facebook pages disconnected successfully.",
        });
    } catch (error) {
        console.error("Failed to disconnect all Facebook pages:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
