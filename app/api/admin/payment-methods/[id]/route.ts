import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.email || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();

        // Remove undefined values from body so we only update what's passed
        const dataToUpdate = Object.fromEntries(
            Object.entries(body).filter(([_, v]) => v !== undefined)
        );

        if (Object.keys(dataToUpdate).length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 });
        }

        const method = await prisma.paymentMethod.update({
            where: { id },
            data: dataToUpdate
        });

        return NextResponse.json(method);
    } catch (error) {
        console.error("Error updating payment method:", error);
        return NextResponse.json({ error: "Failed to update method" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.email || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await prisma.paymentMethod.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting payment method:", error);
        return NextResponse.json({ error: "Failed to delete method" }, { status: 500 });
    }
}
