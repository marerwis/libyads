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

        const payload = await req.json();
        const {
            campaignName,
            objective,
            pageId,
            adCreationType,
            postId,
            minAge,
            maxAge,
            genders,
            countries,
            budget,
            duration,
            primaryText,
            headline,
            mediaBase64
        } = payload;

        if (!campaignName || !pageId || !budget || !duration) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (adCreationType === 'EXISTING_POST' && !postId) {
            return NextResponse.json({ error: "Post ID is required for existing posts" }, { status: 400 });
        }

        if (adCreationType === 'NEW_CREATIVE' && !mediaBase64) {
            return NextResponse.json({ error: "Media is required for new creatives" }, { status: 400 });
        }

        // Step 1: Check wallet balance
        const hasBalance = await walletService.checkBalance(user.id, budget);
        if (!hasBalance) {
            return NextResponse.json({ error: "Insufficient wallet balance to run this campaign" }, { status: 400 });
        }

        // Generate Target Options Object
        const targetingOptions = {
            minAge: minAge || 18,
            maxAge: maxAge || 65,
            genders: genders || [],
            countries: countries && countries.length > 0 ? countries : ["SA"]
        };

        // Save campaign to database first as PENDING
        const campaign = await prisma.campaign.create({
            data: {
                status: "PENDING",
                budget: budget,
                userId: user.id,
                pageId: pageId,
                postId: adCreationType === 'EXISTING_POST' ? postId : null
            }
        });

        console.log(`[API] Created PENDING campaign record: ${campaign.id}`);

        try {
            // Deduct funds immediately
            await walletService.deductFunds(user.id, budget, `Campaign: ${campaignName}`);
            console.log(`[API] Deducted $${budget} from User ${user.id} wallet.`);

            // Upload media to Facebook if creating a new ad
            let imageHash = null;
            if (adCreationType === 'NEW_CREATIVE') {
                console.log(`[API] Uploading custom media to Facebook...`);
                imageHash = await metaService.uploadAdImage(mediaBase64);
                console.log(`[API] Media uploaded successfully. Hash: ${imageHash}`);
            }

            // Create Campaign on Meta
            console.log(`[API] Creating Meta Campaign: ${campaignName} [${objective}]`);
            // Note: we update metaService.createCampaign to accept objective param
            const fbCampaignId = await metaService.createCampaign(campaignName, objective);

            // Create Ad Set
            console.log(`[API] Creating Meta AdSet for Campaign ${fbCampaignId}`);
            const fbAdSetId = await metaService.createAdSet(fbCampaignId, budget, duration, pageId, targetingOptions);

            // Create Ad
            let fbAdId;
            if (adCreationType === 'EXISTING_POST') {
                console.log(`[API] Creating Meta Ad linked to existing post ${postId}`);
                fbAdId = await metaService.createAd(fbAdSetId, pageId, postId);
            } else {
                console.log(`[API] Creating Meta Ad with new custom creative`);
                fbAdId = await metaService.createNewCustomAd(fbAdSetId, pageId, imageHash!, primaryText, headline);
            }

            // Update local DB with success
            await prisma.campaign.update({
                where: { id: campaign.id },
                data: {
                    status: "ACTIVE",
                    campaignId: fbCampaignId,
                    adsetId: fbAdSetId,
                    adId: fbAdId
                }
            });

            console.log(`[API] Campaign fully created on Meta and local DB updated.`);

            return NextResponse.json({
                success: true,
                message: "Campaign created successfully",
                campaignId: campaign.id,
                fbCampaignId
            });

        } catch (metaError: any) {
            console.error(`[API] Meta API Error during creation:`, metaError);

            // Refund the user on failure
            try {
                await walletService.addFunds(user.id, budget, `Refund for failed Campaign: ${campaignName}`);
                console.log(`[API] Refunded $${budget} to User ${user.id} wallet.`);
            } catch (refundError) {
                console.error(`[API] CRITICAL: Failed to process refund!`, refundError);
            }

            // Mark campaign as Failed
            await prisma.campaign.update({
                where: { id: campaign.id },
                data: { status: "FAILED" }
            });

            return NextResponse.json({
                error: "Failed to create campaign on Meta. Funds have been refunded.",
                details: metaError.message || metaError
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error("[API] POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
