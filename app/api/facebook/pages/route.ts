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

        const localPages = await prisma.facebookPage.findMany({
            where: { userId: user.id }
        });

        if (localPages.length === 0) {
            return NextResponse.json([]);
        }

        const mappedPages = localPages.map(p => ({
            id: p.pageId,
            name: p.pageName,
            access_token: p.pageAccessToken,
            pageId: p.pageId,
            pageName: p.pageName
        }));

        return NextResponse.json(mappedPages);
    } catch (error) {
        console.error("Failed to fetch Facebook pages:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
