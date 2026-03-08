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

        const { isActive } = await req.json();

        // Verify ownership before updating
        const rule = await prisma.autoReplyRule.findUnique({
            where: { id }
        });

        if (!rule || rule.userId !== user.id) {
            return NextResponse.json({ error: "Rule not found or unauthorized" }, { status: 404 });
        }

        const updatedRule = await prisma.autoReplyRule.update({
            where: { id },
            data: { isActive: Boolean(isActive) }
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
