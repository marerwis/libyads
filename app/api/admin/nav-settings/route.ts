import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const DEFAULT_NAV_ITEMS = [
    { key: "dashboard", nameAr: "لوحة التحكم", nameEn: "Dashboard", href: "/dashboard", order: 1 },
    { key: "ai_post_reply", nameAr: "الرد الذكي للمنشورات", nameEn: "AI Post Auto-Reply", href: "/dashboard/ai-auto-reply", badge: "AI", order: 2 },
    { key: "ai_page_reply", nameAr: "الرد الشامل الذكي", nameEn: "AI Page Auto-Reply", href: "/dashboard/ai-page-auto-reply", badge: "AI", order: 3 },
    { key: "auto_reply", nameAr: "الرد التلقائي", nameEn: "Auto-Reply", href: "/dashboard/auto-reply", order: 4 },
    { key: "page_auto_reply", nameAr: "الرد الشامل للصفحات", nameEn: "Page Auto-Reply", href: "/dashboard/page-auto-reply", order: 5 },
    { key: "facebook_pages", nameAr: "صفحات فيسبوك", nameEn: "Facebook Pages", href: "/dashboard/facebook", order: 6 },
];

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        // Auto-seed defaults if missing
        for (const item of DEFAULT_NAV_ITEMS) {
            await prisma.navItemSetting.upsert({
                where: { key: item.key },
                update: {},
                create: {
                    key: item.key,
                    nameAr: item.nameAr,
                    nameEn: item.nameEn,
                    href: item.href,
                    badge: item.badge || null,
                    order: item.order,
                    isVisible: true
                }
            });
        }

        const items = await prisma.navItemSetting.findMany({
            orderBy: { order: "asc" }
        });

        return NextResponse.json(items);

    } catch (error) {
        console.error("Failed to fetch nav settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const { key, isVisible } = await req.json();

        if (!key || isVisible === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const updated = await prisma.navItemSetting.update({
            where: { key },
            data: { isVisible: Boolean(isVisible) }
        });

        return NextResponse.json(updated);

    } catch (error) {
        console.error("Failed to update nav setting:", error);
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
            where: { email: session.user.email }
        });

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        // Sync & Discover Core Pages
        let syncedCount = 0;
        for (const item of DEFAULT_NAV_ITEMS) {
            await prisma.navItemSetting.upsert({
                where: { key: item.key },
                update: {
                    nameAr: item.nameAr,
                    nameEn: item.nameEn,
                    href: item.href,
                    order: item.order
                },
                create: {
                    key: item.key,
                    nameAr: item.nameAr,
                    nameEn: item.nameEn,
                    href: item.href,
                    badge: item.badge || null,
                    order: item.order,
                    isVisible: true
                }
            });
            syncedCount++;
        }

        const allItems = await prisma.navItemSetting.findMany({
            orderBy: { order: "asc" }
        });

        return NextResponse.json({ success: true, count: syncedCount, items: allItems });

    } catch (error) {
        console.error("Failed to sync nav settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
