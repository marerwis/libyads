import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { walletService } from "@/lib/walletService";
import { metaService } from "@/lib/metaService";

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { pageId, postId, budget, duration, targetingOptions } = await req.json();

        if (!pageId || !postId || !budget || !duration) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Step 1: Check wallet balance
        const hasBalance = await walletService.checkBalance(user.id, budget);
        if (!hasBalance) {
            return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
        }

        // Step 2: Deduct amount from wallet
        const deducted = await walletService.deductFunds(user.id, budget, `Campaign: ${postId}`);
        if (!deducted) {
            return NextResponse.json({ error: "Failed to deduct funds. Transaction aborted." }, { status: 500 });
        }

        let campaignId = "";
        let adSetId = "";
        let adId = "";

        try {
            // Ensure Meta Config exists
            await metaService.getConfig();

            // Step 3: Create Campaign (PAUSED)
            campaignId = await metaService.createCampaign(`Promo ${postId}`);

            // Step 4: Create Ad Set (PAUSED)
            adSetId = await metaService.createAdSet(campaignId, budget / duration, duration, pageId, targetingOptions);

            // Step 5: Create Ad (PAUSED)
            adId = await metaService.createAd(adSetId, pageId, postId);

            // Step 6: Activate Ad / Campaign
            await metaService.activateCampaign(campaignId);

            // Step 7: Save locally
            const localCampaign = await prisma.campaign.create({
                data: {
                    userId: user.id,
                    campaignId,
                    adsetId: adSetId,
                    adId,
                    budget: budget,
                    status: "ACTIVE",
                }
            });

            return NextResponse.json({ success: true, campaign: localCampaign });

        } catch (metaError: any) {
            console.error("Meta API Execution Failed:", metaError);

            // Critical: Refund wallet automatically on Meta failure
            await walletService.refundWallet(user.id, budget, `Meta API Failure: ${metaError.message}`);

            return NextResponse.json({
                error: "Failed to create promotion with Facebook. Your wallet has been refunded.",
                details: metaError.message
            }, { status: 500 });
        }

    } catch (error) {
        console.error("Critical error in Campaign Creation handler:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
