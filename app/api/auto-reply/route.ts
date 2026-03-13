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

        const rules = await prisma.autoReplyRule.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(rules);
    } catch (error) {
        console.error("Failed to fetch auto-reply rules:", error);
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

        const { pageId, postId, replyText, privateMessage, includeName, keywords, activeDays } = await req.json();

        if (!pageId || !postId || !replyText) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Validate if rule already exists for this post
        const existingRule = await prisma.autoReplyRule.findFirst({
            where: {
                userId: user.id,
                postId: postId
            }
        });

        if (existingRule) {
            return NextResponse.json({ error: "An auto-reply rule already exists for this post. Please edit or delete it." }, { status: 400 });
        }

        const newRule = await prisma.autoReplyRule.create({
            data: {
                userId: user.id,
                pageId,
                postId,
                replyText,
                privateMessage: privateMessage || null,
                includeName,
                keywords: keywords ? String(keywords).toLowerCase() : null,
                isActive: true,
                activeDays: activeDays ? parseInt(activeDays, 10) : 30
            }
        });

        return NextResponse.json(newRule);
    } catch (error) {
        console.error("Failed to create auto-reply rule:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
