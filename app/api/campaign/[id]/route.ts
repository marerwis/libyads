import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: "Invalid user" }, { status: 404 });
        }

        const campaignId = params.id;

        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId }
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        if (campaign.userId !== user.id && user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Try to delete from Meta
        if (campaign.campaignId) {
            const metaSetting = await prisma.metaSetting.findFirst();
            const accessToken = metaSetting?.systemUserToken;

            if (accessToken) {
                try {
                    const metaRes = await fetch(`https://graph.facebook.com/v19.0/${campaign.campaignId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ access_token: accessToken })
                    });
                    const metaData = await metaRes.json();
                    if (!metaRes.ok && metaData.error) {
                        console.error('Failed to remote delete Meta Campaign:', metaData.error);
                        // We still proceed to delete the local record even if Meta fails, 
                        // as the user wants the local record gone, or maybe Meta already deleted it.
                    }
                } catch (err) {
                    console.error('Network error requesting Meta API delete:', err);
                }
            }
        }

        await prisma.campaign.delete({
            where: { id: campaignId }
        });

        return NextResponse.json({ success: true, message: "Campaign deleted successfully." }, { status: 200 });
    } catch (error) {
        console.error("Error deleting campaign:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
