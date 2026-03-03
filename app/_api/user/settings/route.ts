import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
    const session = await getServerSession();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { name: true, email: true }
    });

    return NextResponse.json(user);
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, newPassword } = await req.json();

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const updateData: any = { name };

        if (newPassword) {


            updateData.password = await bcrypt.hash(newPassword, 10);
        }

        await prisma.user.update({
            where: { id: user.id },
            data: updateData
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update user settings:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
