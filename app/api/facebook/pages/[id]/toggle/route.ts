import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        const body = await req.json();
        const { isAutoReplyActive } = body;
        const page = await prisma.facebookPage.findFirst({ where: { id: params.id, userId: user.id } });
        if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });
        const updated = await prisma.facebookPage.update({
            where: { id: params.id },
            data: { isAutoReplyActive: Boolean(isAutoReplyActive) }
        });
        return NextResponse.json(updated);
    } catch (error) {
        console.error("Toggle error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}