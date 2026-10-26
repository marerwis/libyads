import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let localPages: any[] = [];

        if (user.role === "ADMIN") {
            // Admin sees all registered Facebook pages
            localPages = await prisma.facebookPage.findMany({
                orderBy: { pageName: 'asc' }
            });
        } else {
            // Regular user: check if per-user page restriction is active
            const sysSetting = await prisma.systemSetting.findFirst();
            const isRestrictionActive = Boolean(sysSetting?.restrictPagesByUser);

            if (isRestrictionActive) {
                // Fetch allowed pages assigned specifically to this user
                const allowed = await prisma.userAllowedPage.findMany({
                    where: { userId: user.id },
                    select: { pageId: true }
                });

                if (allowed.length === 0) {
                    return NextResponse.json([]);
                }

                const allowedIds = allowed.map(a => a.pageId);
                localPages = await prisma.facebookPage.findMany({
                    where: { pageId: { in: allowedIds } },
                    orderBy: { pageName: 'asc' }
                });
            } else {
                // Restriction is off: show all system pages
                localPages = await prisma.facebookPage.findMany({
                    orderBy: { pageName: 'asc' }
                });
            }
        }

        const mappedPages = localPages.map(p => ({
            id: p.pageId,
            name: p.pageName,
            access_token: p.pageAccessToken,
            pageId: p.pageId,
            pageName: p.pageName,
            status: p.status,
            isAutoReplyActive: p.isAutoReplyActive
        }));

        return NextResponse.json(mappedPages);
    } catch (error) {
        console.error("Failed to fetch Facebook pages:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
