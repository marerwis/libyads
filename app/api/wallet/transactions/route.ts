import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                walletTransactions: {
                    orderBy: { createdAt: "desc" },
                    take: 20,
                },
                wallet: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            balance: user.wallet?.balance || 0,
            transactions: user.walletTransactions,
        });
    } catch (error) {
        console.error("Wallet transactions error:", error);
        return NextResponse.json(
            { error: "An error occurred fetching transactions" },
            { status: 500 }
        );
    }
}
