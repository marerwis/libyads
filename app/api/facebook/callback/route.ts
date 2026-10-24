import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
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

        const metaSetting = await prisma.metaSetting.findFirst();

        if (!metaSetting || !metaSetting.appId || !metaSetting.appSecret) {
            return NextResponse.redirect(new URL("/dashboard/facebook?error=missing_meta_api_settings", req.url));
        }

        // Use NEXTAUTH_URL to build the correct redirect URI (NOT url.origin which can be localhost)
        const baseUrl = process.env.NEXTAUTH_URL || "https://libyadsweb.onrender.com";
        const redirectUri = `${baseUrl}/api/facebook/callback`;

        // Exchange code for User Access Token
        const tokenExchangeUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${metaSetting.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${metaSetting.appSecret}&code=${code}`;

        const tokenRes = await fetch(tokenExchangeUrl);
        const tokenData = await tokenRes.json();

        if (tokenData.error) {
            console.error("Error exchanging code for token:", tokenData.error);
            return NextResponse.redirect(new URL("/dashboard/facebook?error=token_exchange_failed", req.url));
        }

        const userAccessToken = tokenData.access_token;

        // Save the User Access Token
        await prisma.metaSetting.update({
            where: { id: metaSetting.id },
            data: { userAccessToken: userAccessToken }
        });

        // Fetch the User Pages
        let accounts: any[] = [];
        let pagesUrl: string | null = `https://graph.facebook.com/v19.0/me/accounts?limit=500&access_token=${userAccessToken}`;

        while (pagesUrl) {
            const pagesRes = await fetch(pagesUrl);
            const pagesData = await pagesRes.json();

            if (pagesData.error) {
                console.error("Error fetching pages:", pagesData.error);
                return NextResponse.redirect(new URL("/dashboard/facebook?error=fetch_pages_failed", req.url));
            }

            if (pagesData.data) {
                accounts = accounts.concat(pagesData.data);
            }

            pagesUrl = pagesData.paging?.next || null;
        }

        // Save pages to DB
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

        return NextResponse.redirect(new URL("/dashboard/facebook?success=pages_connected", req.url));

    } catch (error) {
        console.error("Failed to complete Facebook OAuth:", error);
        return NextResponse.redirect(new URL("/dashboard/facebook?error=internal_server_error", req.url));
    }
}