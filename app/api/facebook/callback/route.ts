import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        // Parse the URL to get the authorization code
        const url = new URL(req.url);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (error) {
            console.error("Facebook OAuth Error:", error, url.searchParams.get("error_description"));
            return NextResponse.redirect(new URL("/dashboard/facebook?error=oauth_failed", req.url));
        }

        if (!code) {
            return NextResponse.redirect(new URL("/dashboard/facebook?error=no_code", req.url));
        }

        // Fetch Meta Settings to get App ID and Secret
        const metaSetting = await prisma.metaSetting.findFirst();

        if (!metaSetting || !metaSetting.appId || !metaSetting.appSecret) {
            return NextResponse.redirect(new URL("/dashboard/facebook?error=missing_meta_api_settings", req.url));
        }

        // Define the Redirect URI exactly as provided to Facebook
        const redirectUri = `${url.origin}/api/facebook/callback`;

        // 1. Exchange the code for a User Access Token
        const tokenExchangeUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${metaSetting.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${metaSetting.appSecret}&code=${code}`;

        const tokenRes = await fetch(tokenExchangeUrl);
        const tokenData = await tokenRes.json();

        if (tokenData.error) {
            console.error("Error exchanging code for token:", tokenData.error);
            return NextResponse.redirect(new URL("/dashboard/facebook?error=token_exchange_failed", req.url));
        }

        const userAccessToken = tokenData.access_token;

        // 2. Fetch the User's Pages using the User Access Token
        const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}`;
        const pagesRes = await fetch(pagesUrl);
        const pagesData = await pagesRes.json();

        if (pagesData.error) {
            console.error("Error fetching pages:", pagesData.error);
            return NextResponse.redirect(new URL("/dashboard/facebook?error=fetch_pages_failed", req.url));
        }

        const accounts = pagesData.data || [];

        // 3. Save all fetched pages to the database
        // Using upsert logic: if pageId belongs to the user update the token and name, else create it.
        if (accounts.length > 0) {
            await prisma.$transaction(
                accounts.map((page: any) =>
                    prisma.facebookPage.upsert({
                        where: { pageId: page.id },
                        update: {
                            pageName: page.name,
                            pageAccessToken: page.access_token,
                            userId: user.id
                        },
                        create: {
                            pageId: page.id,
                            pageName: page.name,
                            pageAccessToken: page.access_token,
                            userId: user.id
                        }
                    })
                )
            );
        }

        // Redirect back to the Facebook pages UI with success parameter
        return NextResponse.redirect(new URL("/dashboard/facebook?success=pages_connected", req.url));

    } catch (error) {
        console.error("Failed to complete Facebook OAuth:", error);
        return NextResponse.redirect(new URL("/dashboard/facebook?error=internal_server_error", req.url));
    }
}
