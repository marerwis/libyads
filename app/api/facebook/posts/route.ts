import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const pageId = searchParams.get('pageId');

        if (!pageId) {
            return NextResponse.json({ error: "Page ID is required" }, { status: 400 });
        }

        // 1. Fetch available accounts to find the specific Page Access Token needed to read posts
        const page = await prisma.facebookPage.findUnique({
            where: { pageId: pageId }
        });

        if (!page || !page.pageAccessToken) {
            return NextResponse.json({ error: "Page access token not found" }, { status: 404 });
        }

        const pageToken = page.pageAccessToken;

        // 2. Fetch latest published posts for the given page using its specific token
        const url = `https://graph.facebook.com/v19.0/${pageId}/posts?access_token=${pageToken}&fields=id,message,created_time,full_picture,permalink_url&limit=15`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
            return NextResponse.json({
                error: "Failed to fetch posts from Facebook",
                details: data.error.message
            }, { status: 500 });
        }

        return NextResponse.json(data.data || []);

    } catch (error) {
        console.error("Error fetching Facebook posts:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
