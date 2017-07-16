import BinomAPIClient from 'binom-api-client';
import fs from 'fs';
import TimedStore from 'timed-store';
import cli from 'cli';

cli.enable('status');

const options = cli.parse({
    cmd: ['c', '{fetch|analyze}', 'string']
});

const configFileName = '.smrtmnk.com.json';

console.log(`loading config from ${configFileName}`);
const stringConfig = fs.readFileSync(configFileName, 'utf-8');
const config = JSON.parse(stringConfig);

const binom = new BinomAPIClient(config);
const store = new TimedStore('store.json');

const fieldsOfInterest = {
    id: 'number',
    name: 'string',
    LP_CTR: 'number',
    clicks: 'number',
    leads: 'number',
    ROI: 'number'
}

const processCampaign = (campaign) => {
    let result = {};
    for(const field in fieldsOfInterest) {
        result[field] = campaign[field];
        if(fieldsOfInterest[field] === 'number') {
            result[field] = parseFloat(result[field]);
        }
    }
    return result;
}

const needsWhitelisting = (campaign) => {
    return ((campaign.leads > 3 &&
       campaign.roi > 200) ||
    (campaign.leads > 0 &&
       campaign.roi > 0))
}

const needsBlacklisting = (campaign) => {
    return campaign.clicks > 100 && campaign.LP_CTR < 10;
}

if(options.cmd === 'fetch') {
    binom.getCampaignList()
    .then(result => {
        result = result.map(campaign => processCampaign(campaign));
        console.log(`got ${result.length} campaigns`);
        store.addDataPoint('campaigns', result);
        cli.ok('fetch complete');
        process.exit(0);
    })
    .catch(err => {
        console.error(err.toString());
        process.exit(1);
    });
} else if(options.cmd === 'analyze') {
    const { timestamp, set } = store.getLatest('campaigns');
    if(!set) { cli.fatal('no fetched data') }
    const date = new Date(+timestamp);
    console.log(`working at ${date.toString()}`);

    let wl = [];
    let bl = [];

    set.map(campaign => {
        if(needsWhitelisting(campaign)) {
            wl.push(campaign.id);
            console.log(`needs whitelisting: ${campaign.name}`);
        }
        if(needsBlacklisting(campaign)) {
            bl.push(campaign.id);
            console.log(`needs blacklisting: ${campaign.name}`);
        }
    })
    store.addDataPoint('whilelist', wl);
    store.addDataPoint('blacklist', bl);

    process.exit(0);
} else {
    cli.fatal(`unknown cmd: ${options.cmd}`)
}
