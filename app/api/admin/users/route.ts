import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET all users (Admin only)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                wallet: { select: { balance: true } },
                _count: {
                    select: {
                        facebookPages: true,
                        campaigns: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

// PATCH user role (Admin only)
export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { userId, newRole } = body;

        if (!userId || !newRole || !['ADMIN', 'USER'].includes(newRole)) {
            return NextResponse.json({ error: "Invalid data provided" }, { status: 400 });
        }

        // Prevent self-demotion as a basic safety measure
        if (userId === session.user.id && newRole === 'USER') {
            return NextResponse.json({ error: "Cannot demote yourself" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
            select: { id: true, name: true, email: true, role: true }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error updating user role:", error);
        return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
    }
}
