import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const settings = await prisma.metaSetting.findFirst();
    return NextResponse.json(settings || {});
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { appId, appSecret, systemUserToken, businessId, adAccountId } = body;

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // We ensure only one global setting row exists across the entire app.
        const existing = await prisma.metaSetting.findFirst();

        let settings;
        if (existing) {
            settings = await prisma.metaSetting.update({
                where: { id: existing.id },
                data: { appId, appSecret, systemUserToken, businessId, adAccountId, userId: user.id },
            });

            // Cleanup any accidental duplicates to enforce exactly one row
            await prisma.metaSetting.deleteMany({
                where: { id: { not: existing.id } }
            });
        } else {
            settings = await prisma.metaSetting.create({
                data: { appId, appSecret, systemUserToken, businessId, adAccountId, userId: user.id },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Failed to save Meta settings:", error);
        return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
}
