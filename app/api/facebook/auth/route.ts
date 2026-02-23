import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch Meta Settings to get the App ID
        const metaSetting = await prisma.metaSetting.findFirst();

        if (!metaSetting || !metaSetting.appId) {
            return NextResponse.json({
                error: "Meta API Configuration is incomplete. Please contact the administrator to set up the App ID."
            }, { status: 400 });
        }

        const APP_ID = metaSetting.appId;

        // Define scopes required for managing campaigns and viewing pages
        const SCOPES = "pages_show_list,pages_read_engagement,pages_manage_posts";

        // Generate the App URL based on the request origin (e.g. http://localhost:3000)
        const url = new URL(req.url);
        const redirectUri = `${url.origin}/api/facebook/callback`;

        // We use State parameter to mitigate CSRF attacks
        const state = Math.random().toString(36).substring(7);

        // Construct Facebook OAuth URL
        const fbOAuthURL = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${SCOPES}`;

        // Return a JSON response pointing the frontend to the authorization URL
        return NextResponse.json({ url: fbOAuthURL });

    } catch (error) {
        console.error("Failed to generate Facebook OAuth URL:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
