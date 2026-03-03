import { NextResponse } from 'next/server';
import { metaService } from '@/lib/metaService';

const bizSdk = require('facebook-nodejs-business-sdk');
const AdAccount = bizSdk.AdAccount;
const FacebookAdsApi = bizSdk.FacebookAdsApi;

export async function GET() {
    try {
        const config = await metaService.getConfig();
        FacebookAdsApi.init(config.systemUserToken);

        const account = new AdAccount(`act_${config.adAccountId}`);
        const campaigns = await account.getCampaigns(['name', 'status', 'objective', 'created_time'], { limit: 20 });

        return NextResponse.json({
            success: true,
            total_found: campaigns.length,
            campaigns: campaigns.map((c: any) => ({
                id: c.id,
                name: c.name,
                status: c.status,
                objective: c.objective,
                created_time: c.created_time
            }))
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
    }
}
