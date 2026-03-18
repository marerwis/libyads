import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
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

        const { isActive } = await req.json();

        // Verify ownership
        const rule = await prisma.pageAutoReplyRule.findUnique({
            where: { id: params.id }
        });

        if (!rule || rule.userId !== user.id) {
            return NextResponse.json({ error: "Rule not found or unauthorized" }, { status: 404 });
        }

        const updatedRule = await prisma.pageAutoReplyRule.update({
            where: { id: params.id },
            data: { isActive: isActive }
        });

        return NextResponse.json(updatedRule);
    } catch (error) {
        console.error("Failed to update page auto-reply rule:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
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

        // Verify ownership
        const rule = await prisma.pageAutoReplyRule.findUnique({
            where: { id: params.id }
        });

        if (!rule || rule.userId !== user.id) {
            return NextResponse.json({ error: "Rule not found or unauthorized" }, { status: 404 });
        }

        await prisma.pageAutoReplyRule.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete page auto-reply rule:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
