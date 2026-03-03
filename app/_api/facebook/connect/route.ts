import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { pageId, pageName, pageAccessToken } = await req.json();

        if (!pageId || !pageName || !pageAccessToken) {
            return NextResponse.json({ error: "Missing page data" }, { status: 400 });
        }

        // Save or update the Facebook Page data
        const page = await prisma.facebookPage.upsert({
            where: { pageId: pageId },
            update: {
                pageName,
                pageAccessToken,
                userId: user.id
            },
            create: {
                pageId,
                pageName,
                pageAccessToken,
                userId: user.id
            }
        });

        return NextResponse.json(page);
    } catch (error) {
        console.error("Failed to connect Facebook Page:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
