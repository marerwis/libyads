import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            console.log("Sync Error: No session or email found");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("Sync: Starting for user", session.user.email);

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { metaSettings: true },
        });

        if (!user) {
            console.log("Sync Error: User not found in DB");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userAccessToken = user.metaSettings?.userAccessToken;

        if (!userAccessToken) {
            console.log("Sync Error: No userAccessToken found in metaSettings");
            return NextResponse.json({ error: "No Facebook connection found. Please connect your Facebook account." }, { status: 400 });
        }

        console.log("Sync: userAccessToken found, starting to fetch pages");

        // Fetch user pages
        let accounts: any[] = [];
        let pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?limit=500&access_token=${userAccessToken}`;

        while (pagesUrl) {
            const pagesRes = await fetch(pagesUrl);
            const pagesData = await pagesRes.json();

            if (pagesData.error) {
                console.error("Error fetching pages during sync:", pagesData.error);
                return NextResponse.json({ error: "Failed to fetch pages from Facebook. Token may be expired." }, { status: 400 });
            }

            if (pagesData.data) {
                accounts = accounts.concat(pagesData.data);
            }

            pagesUrl = pagesData.paging?.next || null;
        }

        if (accounts.length > 0) {
            console.log(`Sync: Updating/Creating ${accounts.length} pages in DB`);
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
            console.log("Sync: Transaction complete");
        } else {
            console.log("Sync: No accounts found from Facebook API");
        }

        return NextResponse.json({ success: true, count: accounts.length });

    } catch (error) {
        console.error("Failed to sync Facebook pages:", error);
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
