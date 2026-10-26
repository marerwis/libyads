import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Always use NEXTAUTH_URL for redirects (Render uses reverse proxy so req.url = localhost)
const APP_URL = process.env.NEXTAUTH_URL || "https://libyadsweb.onrender.com";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.redirect(`${APP_URL}/login`);
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.redirect(`${APP_URL}/login`);
        }

        const url = new URL(req.url);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (error) {
            console.error("Facebook OAuth Error:", error);
            return NextResponse.redirect(`${APP_URL}/dashboard/facebook?error=oauth_failed`);
        }

        if (!code) {
            return NextResponse.redirect(`${APP_URL}/dashboard/facebook?error=no_code`);
        }

        const metaSetting = await prisma.metaSetting.findFirst();

        if (!metaSetting || !metaSetting.appId || !metaSetting.appSecret) {
            return NextResponse.redirect(`${APP_URL}/dashboard/facebook?error=missing_meta_api_settings`);
        }

        // Use APP_URL for redirect URI (not req.url origin which is localhost on Render)
        const redirectUri = `${APP_URL}/api/facebook/callback`;

        // Exchange code for User Access Token
        const tokenExchangeUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${metaSetting.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${metaSetting.appSecret}&code=${code}`;

        const tokenRes = await fetch(tokenExchangeUrl);
        const tokenData = await tokenRes.json();

        if (tokenData.error) {
            console.error("Error exchanging code:", tokenData.error);
            return NextResponse.redirect(`${APP_URL}/dashboard/facebook?error=token_exchange_failed`);
        }

        const userAccessToken = tokenData.access_token;

        await prisma.metaSetting.update({
            where: { id: metaSetting.id },
            data: { userAccessToken: userAccessToken }
        });

        // Fetch Facebook Pages
        let accounts: any[] = [];
        let pagesUrl: string | null = `https://graph.facebook.com/v19.0/me/accounts?limit=500&access_token=${userAccessToken}`;

        while (pagesUrl) {
            const pagesRes: Response = await fetch(pagesUrl);
            const pagesData: any = await pagesRes.json();

            if (pagesData.error) {
                console.error("Error fetching pages:", pagesData.error);
                return NextResponse.redirect(`${APP_URL}/dashboard/facebook?error=fetch_pages_failed`);
            }

            if (pagesData.data) accounts = accounts.concat(pagesData.data);
            pagesUrl = pagesData.paging?.next || null;
        }

        // Save pages to DB
        if (accounts.length > 0) {
            await prisma.$transaction(
                accounts.map((page: any) =>
                    prisma.facebookPage.upsert({
                        where: { pageId: page.id },
                        update: { pageName: page.name, pageAccessToken: page.access_token, userId: user.id },
                        create: { pageId: page.id, pageName: page.name, pageAccessToken: page.access_token, userId: user.id }
                    })
                )
            );
        }

        console.log(`✅ Facebook OAuth success: ${accounts.length} pages saved for ${user.email}`);
        return NextResponse.redirect(`${APP_URL}/dashboard/facebook?success=pages_connected`);

    } catch (error) {
        console.error("Failed to complete Facebook OAuth:", error);
        return NextResponse.redirect(`${APP_URL}/dashboard/facebook?error=internal_server_error`);
    }
}