import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // 1. Delete all Facebook pages for this user
        const deleted = await prisma.facebookPage.deleteMany({ where: { userId: user.id } });

        // 2. Clear the userAccessToken from MetaSetting (the global one)
        const metaSetting = await prisma.metaSetting.findFirst();
        if (metaSetting) {
            await prisma.metaSetting.update({
                where: { id: metaSetting.id },
                data: { userAccessToken: null }
            });
        }

        console.log(`Disconnected: Deleted ${deleted.count} pages for ${user.email}`);
        return NextResponse.json({ success: true, deletedPages: deleted.count });
    } catch (error) {
        console.error("Disconnect error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}