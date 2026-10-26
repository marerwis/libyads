import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

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

        const [systemSetting, users, allPages] = await Promise.all([
            prisma.systemSetting.findFirst(),
            prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    allowedPages: {
                        select: { pageId: true }
                    }
                },
                orderBy: { createdAt: "desc" }
            }),
            prisma.facebookPage.findMany({
                select: {
                    pageId: true,
                    pageName: true,
                    status: true,
                    isAutoReplyActive: true
                },
                orderBy: { pageName: "asc" }
            })
        ]);

        return NextResponse.json({
            restrictPagesByUser: Boolean(systemSetting?.restrictPagesByUser),
            users: users.map(u => ({
                ...u,
                allowedPageIds: u.allowedPages.map(p => p.pageId)
            })),
            allPages
        });

    } catch (error) {
        console.error("Failed to fetch user permissions:", error);
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

        const body = await req.json();

        if (body.action === "TOGGLE_RESTRICTION") {
            const enabled = Boolean(body.enabled);
            const setting = await prisma.systemSetting.findFirst();
            if (setting) {
                await prisma.systemSetting.update({
                    where: { id: setting.id },
                    data: { restrictPagesByUser: enabled }
                });
            } else {
                await prisma.systemSetting.create({
                    data: { restrictPagesByUser: enabled }
                });
            }
            return NextResponse.json({ success: true, restrictPagesByUser: enabled });
        }

        if (body.action === "SET_USER_PAGES") {
            const { targetUserId, allowedPageIds } = body;
            if (!targetUserId || !Array.isArray(allowedPageIds)) {
                return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
            }

            // Sync allowed pages in transaction
            await prisma.$transaction(async (tx) => {
                // Delete existing allowed pages for this user
                await tx.userAllowedPage.deleteMany({
                    where: { userId: targetUserId }
                });

                // Create new entries
                if (allowedPageIds.length > 0) {
                    await tx.userAllowedPage.createMany({
                        data: allowedPageIds.map((pId: string) => ({
                            userId: targetUserId,
                            pageId: String(pId)
                        }))
                    });
                }
            });

            return NextResponse.json({ success: true, targetUserId, count: allowedPageIds.length });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("Failed to update user permissions:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
