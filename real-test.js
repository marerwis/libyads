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
let campaign_name = 'Real Test Campaign';

const api = bizSdk.FacebookAdsApi.init(access_token);
const showDebugingInfo = true; // Setting this to true shows more debugging info.
if (showDebugingInfo) {
    api.setDebug(true);
}

const logApiCallResult = (apiCallName, data) => {
    console.log(apiCallName);
    if (showDebugingInfo) {
        console.log('Data:' + JSON.stringify(data));
    }
};

let fields, params;

void async function () {
    try {
        // Create an ad campaign with objective OUTCOME_TRAFFIC
        fields = [
        ];
        params = {
            'name': campaign_name,
            'objective': 'OUTCOME_TRAFFIC',
            'status': 'PAUSED',
            'special_ad_categories': [],
            'is_adset_budget_sharing_enabled': false
        };
        let campaign = await (new AdAccount(ad_account_id)).createCampaign(
            fields,
            params
        );
        let campaign_id = campaign.id;

        console.log('Your created campaign is with campaign_id:' + campaign_id);

    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}();
