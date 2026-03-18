import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const setting = await prisma.systemSetting.findFirst();

        return NextResponse.json({
            autoReplyPrice: setting?.autoReplyPrice ?? 0.1,
            pageAutoReplyPrice: setting?.pageAutoReplyPrice ?? 0.5,
            autoReplyEnabled: setting?.autoReplyEnabled ?? true
        });

    } catch (error) {
        console.error("Failed to fetch auto-reply config:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
