import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const isAdmin = session?.user?.role === "ADMIN";

        // Query settings
        const items = await prisma.navItemSetting.findMany({
            orderBy: { order: "asc" }
        });

        // Filter for normal users
        const visibleItems = items.filter(item => isAdmin ? true : item.isVisible);

        return NextResponse.json({
            isAdmin,
            items: visibleItems.map(item => ({
                key: item.key,
                nameAr: item.nameAr,
                nameEn: item.nameEn,
                href: item.href,
                badge: item.badge,
                isVisible: item.isVisible
            }))
        });

    } catch (error) {
        console.error("Failed to fetch nav items:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
