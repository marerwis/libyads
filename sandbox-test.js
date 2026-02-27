'use strict';
const bizSdk = require('facebook-nodejs-business-sdk');
const AdAccount = bizSdk.AdAccount;
const Campaign = bizSdk.Campaign;

let access_token = 'EAAMzyveD87IBQ8woEkMzJMjlsnIYZAWwlk7HQxUTq75zodDVJd2qPEHYum2RVwlzeMH9Nm5ZC7gyupQZAXdLprRbRQqIhIrv669laFOkq0bDoZArMtca2QV2e33nn06jrzBzGAzfCHhOM6gFI7dQZCGLlFiqBYaZCkEcIMlMj6X9ry6TtvE5JlhpMI04s9q6ZAEYSZBx';
let app_id = '901371759162290';
let ad_account_id = 'act_1658496568480298';
let campaign_name = 'Test Sandbox Campaign';

const api = bizSdk.FacebookAdsApi.init(access_token);
const showDebugingInfo = true;
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
        fields = [];
        params = {
            'name': campaign_name,
            'objective': 'OUTCOME_TRAFFIC',
            'status': 'PAUSED',
            'special_ad_categories': ['NONE'],
            'is_adset_budget_sharing_enabled': false
        };
        console.log("Creating campaign in Sandbox Ad Account: " + ad_account_id);
        let campaign = await (new AdAccount(ad_account_id)).createCampaign(
            fields,
            params
        );
        let campaign_id = campaign.id;

        console.log('✅ Your created campaign is with campaign_id: ' + campaign_id);

    } catch (error) {
        console.error("❌ Error:");
        console.error(error);
        process.exit(1);
    }
}();
