import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET all payment methods (Available to everyone authenticated, to see options)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const methods = await prisma.paymentMethod.findMany({
            orderBy: { createdAt: 'desc' },
        });

        // If user is not admin, only return active methods and exclude details if you want it more secure
        if (session.user.role !== "ADMIN") {
            const activeMethods = methods.filter(m => m.isActive);
            return NextResponse.json(activeMethods);
        }

        // Admin gets all methods
        return NextResponse.json(methods);
    } catch (error) {
        console.error("Error fetching payment methods:", error);
        return NextResponse.json({ error: "Failed to fetch methods" }, { status: 500 });
    }
}

// POST a new payment method (Admin only)
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { name, type, details, instructions, isActive, environment, publicKey, secretKey, webhookSecret } = body;

        if (!name || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const method = await prisma.paymentMethod.create({
            data: {
                name,
                type,
                details: details || "",
                instructions: instructions || null,
                isActive: isActive !== undefined ? isActive : true,
                environment: environment || "SANDBOX",
                publicKey: publicKey || null,
                secretKey: secretKey || null,
                webhookSecret: webhookSecret || null,
            }
        });

        return NextResponse.json(method);
    } catch (error) {
        console.error("Error creating payment method:", error);
        return NextResponse.json({ error: "Failed to create method" }, { status: 500 });
    }
}
