import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { metaService } from '@/lib/metaService';

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        // Ensure user is authenticated
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { status } = body; // Expects "ACTIVE" or "PAUSED"

        if (!status || !["ACTIVE", "PAUSED"].includes(status)) {
            return NextResponse.json({ error: "Invalid status provided. Must be ACTIVE or PAUSED." }, { status: 400 });
        }

        // 1. Verify campaign belongs to the user
        const campaign = await prisma.campaign.findUnique({
            where: { id },
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        if (campaign.userId !== session.user.id && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Forbidden. You don't own this campaign." }, { status: 403 });
        }

        if (!campaign.campaignId) {
            return NextResponse.json({ error: "Cannot toggle status. This campaign has no Meta ID (creation may have failed)." }, { status: 400 });
        }

        // 2. Update status on Meta (Facebook API)
        try {
            await metaService.updateCampaignStatus(campaign.campaignId, status);
        } catch (metaError: any) {
            console.error("Failed to update status on Meta:", metaError);
            return NextResponse.json({
                error: "Failed to update campaign on Facebook.",
                details: metaError.message
            }, { status: 500 });
        }

        // 3. Update status in Database
        const updatedCampaign = await prisma.campaign.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json({
            message: `Campaign status updated to ${status} successfully.`,
            campaign: updatedCampaign
        });

    } catch (error: any) {
        console.error("PUT Campaign Status Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
