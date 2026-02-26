import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { metaService } from "@/lib/metaService";

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

        const config = await metaService.getConfig();

        // 1. Fetch available accounts to find the specific Page Access Token needed to read posts
        const accountsUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${config.systemUserToken}`;
        const accountsRes = await fetch(accountsUrl);
        const accountsData = await accountsRes.json();

        let pageToken = config.systemUserToken;
        if (accountsData.data) {
            const page = accountsData.data.find((p: any) => p.id === pageId);
            if (page && page.access_token) {
                pageToken = page.access_token;
            }
        }

        // 2. Fetch latest published posts for the given page using its specific token
        const url = `https://graph.facebook.com/v19.0/${pageId}/posts?access_token=${pageToken}&fields=id,message,created_time,full_picture,permalink_url&limit=15&is_published=true`;

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
