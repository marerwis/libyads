import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
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

        const body = await req.json();

        // Verify ownership
        const rule = await prisma.pageAutoReplyRule.findUnique({
            where: { id }
        });

        if (!rule || rule.userId !== user.id) {
            return NextResponse.json({ error: "Rule not found or unauthorized" }, { status: 404 });
        }

        const updateData: any = {};
        if (body.isActive !== undefined) updateData.isActive = body.isActive;
        if (body.replyTexts !== undefined && Array.isArray(body.replyTexts)) {
            const validReplies = body.replyTexts.filter((t: string) => t.trim().length > 0);
            if (validReplies.length > 0) updateData.replyTexts = validReplies;
        }
        if (body.privateMessage !== undefined) updateData.privateMessage = body.privateMessage || null;
        if (body.includeName !== undefined) updateData.includeName = Boolean(body.includeName);

        const updatedRule = await prisma.pageAutoReplyRule.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updatedRule);
    } catch (error) {
        console.error("Failed to update page auto-reply rule:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
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

        // Verify ownership
        const rule = await prisma.pageAutoReplyRule.findUnique({
            where: { id }
        });

        if (!rule || rule.userId !== user.id) {
            return NextResponse.json({ error: "Rule not found or unauthorized" }, { status: 404 });
        }

        await prisma.pageAutoReplyRule.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete page auto-reply rule:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
