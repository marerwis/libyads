import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

        // Verify ownership before updating
        const rule = await prisma.autoReplyRule.findUnique({
            where: { id }
        });

        if (!rule || rule.userId !== user.id) {
            return NextResponse.json({ error: "Rule not found or unauthorized" }, { status: 404 });
        }

        const updateData: any = {};
        
        if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
        if (body.replyText !== undefined) updateData.replyText = body.replyText;
        if (body.replyText2 !== undefined) updateData.replyText2 = body.replyText2 || null;
        if (body.replyText3 !== undefined) updateData.replyText3 = body.replyText3 || null;
        if (body.privateMessage !== undefined) updateData.privateMessage = body.privateMessage || null;
        if (body.keywords !== undefined) updateData.keywords = body.keywords ? String(body.keywords).toLowerCase() : null;
        if (body.activeDays !== undefined) updateData.activeDays = parseInt(body.activeDays, 10);
        if (body.includeName !== undefined) updateData.includeName = Boolean(body.includeName);

        const updatedRule = await prisma.autoReplyRule.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updatedRule);

    } catch (error) {
        console.error("Failed to update auto-reply rule:", error);
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

        // Verify ownership before deleting
        const rule = await prisma.autoReplyRule.findUnique({
            where: { id }
        });

        if (!rule || rule.userId !== user.id) {
            return NextResponse.json({ error: "Rule not found or unauthorized" }, { status: 404 });
        }

        await prisma.autoReplyRule.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Rule deleted successfully" });

    } catch (error) {
        console.error("Failed to delete auto-reply rule:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
