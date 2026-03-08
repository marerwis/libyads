import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let setting = await prisma.systemSetting.findFirst();

        // Create default if not exists
        if (!setting) {
            setting = await prisma.systemSetting.create({
                data: {
                    autoReplyPrice: 0.1,
                    autoReplyEnabled: true
                }
            });
        }

        return NextResponse.json(setting);

    } catch (error) {
        console.error("Failed to fetch auto-reply settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();

        let setting = await prisma.systemSetting.findFirst();

        if (setting) {
            setting = await prisma.systemSetting.update({
                where: { id: setting.id },
                data: {
                    autoReplyPrice: parseFloat(data.autoReplyPrice) || 0,
                    autoReplyEnabled: Boolean(data.autoReplyEnabled)
                }
            });
        } else {
            setting = await prisma.systemSetting.create({
                data: {
                    autoReplyPrice: parseFloat(data.autoReplyPrice) || 0,
                    autoReplyEnabled: Boolean(data.autoReplyEnabled)
                }
            });
        }

        return NextResponse.json(setting);

    } catch (error) {
        console.error("Failed to update auto-reply settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
