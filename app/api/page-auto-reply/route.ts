import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const rules = await prisma.pageAutoReplyRule.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(rules);
    } catch (error) {
        console.error("Failed to fetch page auto-reply rules:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { pageId, replyTexts, privateMessage, includeName, activeDays } = await req.json();

        if (!pageId || !replyTexts || !Array.isArray(replyTexts) || replyTexts.length === 0) {
            return NextResponse.json({ error: "Missing required fields or empty replies" }, { status: 400 });
        }

        // Validate if rule already exists for this page
        const existingRule = await prisma.pageAutoReplyRule.findFirst({
            where: {
                userId: user.id,
                pageId: pageId
            }
        });

        if (existingRule) {
            return NextResponse.json({ error: "An auto-reply rule already exists for this page. Please edit or delete it." }, { status: 400 });
        }

        // Filter out empty replies
        const validReplies = replyTexts.filter(text => text.trim().length > 0);
        
        if(validReplies.length === 0) {
             return NextResponse.json({ error: "You must provide at least one valid reply text." }, { status: 400 });
        }

        const newRule = await prisma.pageAutoReplyRule.create({
            data: {
                userId: user.id,
                pageId,
                replyTexts: validReplies,
                privateMessage: privateMessage || null,
                includeName,
                isActive: true,
                activeDays: activeDays ? parseInt(activeDays, 10) : 30
            }
        });

        return NextResponse.json(newRule);
    } catch (error) {
        console.error("Failed to create page auto-reply rule:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
