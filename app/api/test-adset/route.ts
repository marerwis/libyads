import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const config = await prisma.metaSetting.findFirst();
        if (!config) return NextResponse.json({ error: 'no config' });

        // 1. Create Campaign
        const campRes = await fetch(`https://graph.facebook.com/v19.0/act_${config.adAccountId}/campaigns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Validation Campaign',
                objective: 'OUTCOME_ENGAGEMENT',
                status: 'PAUSED',
                special_ad_categories: ['NONE'],
                access_token: config.systemUserToken
            })
        });
        const campaign = await campRes.json();
        if (!campaign.id) return NextResponse.json({ campaign_error: campaign });

        // 2. Create Ad Set with Region 4450 (Benghazi)
        const adSetRes = await fetch(`https://graph.facebook.com/v19.0/act_${config.adAccountId}/adsets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Debug AdSet',
                campaign_id: campaign.id,
                daily_budget: 1000,
                start_time: new Date(Date.now() + 3600000).toISOString(),
                billing_event: 'IMPRESSIONS',
                optimization_goal: 'POST_ENGAGEMENT',
                bid_amount: 2,
                promoted_object: { page_id: '139132492608910', object_store_url: 'http://www.facebook.com' },
                targeting: {
                    geo_locations: {
                        regions: [{ key: '4450' }]
                    }
                },
                status: 'PAUSED',
                access_token: config.systemUserToken
            })
        });
        const adSet = await adSetRes.json();

        return NextResponse.json({ campaign, adSet });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
