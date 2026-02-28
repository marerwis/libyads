import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch only active payment methods
        const methods = await prisma.paymentMethod.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(methods);
    } catch (error) {
        console.error("Failed to fetch payment methods:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
