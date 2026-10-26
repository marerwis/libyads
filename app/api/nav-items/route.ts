import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        
        let isAdmin = false;
        if (session?.user?.email) {
            const dbUser = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { role: true }
            });
            isAdmin = dbUser?.role === "ADMIN";
        }

        // Query settings
        const items = await prisma.navItemSetting.findMany({
            orderBy: { order: "asc" }
        });

        // Compute keys that are hidden from normal users
        const hiddenKeys = isAdmin ? [] : items.filter(item => !item.isVisible).map(item => item.key);

        return NextResponse.json({
            isAdmin,
            hiddenKeys,
            items: items.map(item => ({
                key: item.key,
                nameAr: item.nameAr,
                nameEn: item.nameEn,
                href: item.href,
                badge: item.badge,
                isVisible: isAdmin ? true : item.isVisible
            }))
        });

    } catch (error) {
        console.error("Failed to fetch nav items:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
