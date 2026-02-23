import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { walletService } from "@/lib/walletService";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params; // This is the user ID to top-up
        const session = await getServerSession(authOptions);

        // 1. Validate Admin Authorization
        if (!session?.user?.email || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // 2. Parse Request Body
        const body = await req.json();
        const amount = Number(body.amount);

        if (!amount || isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: "Invalid top-up amount" }, { status: 400 });
        }

        // 3. Add Funds using Wallet Service
        const success = await walletService.addFunds(id, amount, `Admin Top-Up via ${session.user.name || 'Admin'}`);

        if (success) {
            return NextResponse.json({ success: true, message: `Successfully added $${amount} to wallet.` });
        } else {
            return NextResponse.json({ error: "Failed to top up wallet." }, { status: 500 });
        }

    } catch (error) {
        console.error("Error topping up user wallet:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
