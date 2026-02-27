/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 * @flow
 */

'use strict';
const bizSdk = require('facebook-nodejs-business-sdk');
const AdAccount = bizSdk.AdAccount;
const Campaign = bizSdk.Campaign;

let access_token = 'EAAMzyveD87IBQZBM0vNiwhPduXfvSLlnFSmGlwRUoth4mt7mtZBp5AO4RUr6ZAlv6NmXoj7IVrwPmCEcSwtf9ZB6Fj8Rtxqjt9ivzOsSZAlpC2NZCtbsKNEgUvmvupw1PVaiv7FTUEyZBkuDLZAS0U7JbzlZAZCQ2G434rRhgViUKbJv8uDk4vZBeCzGKicErkDJwj01YQBHvkyu26ck1ZCLs2dF';
let app_id = '901371759162290';
let ad_account_id = 'act_781647312723816';
let page_id = '122119131644177651'; // Get a page ID from user or assume a dummy. Actually we just need to see where it fails. I will ask user for post_id or use a dummy. Let's use 122119131644177651_122143003058177651 like before? Wait, I don't have the post ID.

const api = bizSdk.FacebookAdsApi.init(access_token);
const showDebugingInfo = true;
if (showDebugingInfo) {
    api.setDebug(true);
}

void async function () {
    try {
        console.log("1. Creating Campaign...");
        let campaign = await (new AdAccount(ad_account_id)).createCampaign(
            [],
            {
                'name': 'Real Test Flow Campaign',
                'objective': 'OUTCOME_ENGAGEMENT',
                'status': 'PAUSED',
                'special_ad_categories': [],
                'is_adset_budget_sharing_enabled': false
            }
        );
        let campaign_id = campaign.id;
        console.log('Campaign created: ' + campaign_id);

        console.log("2. Creating AdSet...");
        const dailyBudget = 5;
        const durationDays = 2;
        const budgetInMinorUnits = Math.round(dailyBudget * 100);
        const now = new Date();
        const endTime = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        const adSet = await (new AdAccount(ad_account_id)).createAdSet(
            [],
            {
                name: `AdSet for ${campaign_id}`,
                campaign_id: campaign_id,
                daily_budget: budgetInMinorUnits,
                start_time: now.toISOString(),
                end_time: endTime.toISOString(),
                billing_event: 'IMPRESSIONS',
                optimization_goal: 'POST_ENGAGEMENT',
                promoted_object: { page_id: page_id },
                bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
                targeting: { geo_locations: { countries: ["US"] } },
                status: 'PAUSED'
            }
        );
        console.log('AdSet created: ' + adSet.id);

        console.log("3. Creating Ad Creative...");
        let post_id = '122143003058177651'; // Example post ID
        let finalStoryId = `${page_id}_${post_id}`;

        const account = new AdAccount(ad_account_id);
        const creative = await account.createAdCreative(
            [],
            {
                name: `Creative for Post ${post_id}`,
                object_story_id: finalStoryId
            }
        );
        console.log('Ad Creative created: ' + creative.id);

        console.log("4. Creating Ad...");
        const ad = await account.createAd(
            [],
            {
                name: `Ad for Post ${post_id}`,
                adset_id: adSet.id,
                creative: { creative_id: creative.id },
                status: 'PAUSED'
            }
        );
        console.log('Ad created: ' + ad.id);

    } catch (error) {
        console.log("\n--- ERROR DETAILS ---");
        if (error.response && error.response.error) {
            console.log(JSON.stringify(error.response.error, null, 2));
        } else {
            console.log(error);
        }
        process.exit(1);
    }
}();
