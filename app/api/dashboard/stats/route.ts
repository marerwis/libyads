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
                wallet: true,
                campaigns: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const totalCampaigns = user.campaigns.length;
        const activeCampaigns = user.campaigns.filter((c: any) => c.status === "ACTIVE").length;

        // In a real scenario, this would sum up actual spend from Meta API or Wallet DEDUCTIONS
        const totalSpent = user.campaigns.reduce((acc: number, curr: any) => acc + curr.budget, 0);

        return NextResponse.json({
            balance: user.wallet?.balance || 0,
            totalCampaigns,
            activeCampaigns,
            totalSpent
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        return NextResponse.json(
            { error: "An error occurred fetching dashboard stats" },
            { status: 500 }
        );
    }
}
