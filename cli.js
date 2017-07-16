import BinomAPIClient from 'binom-api-client';
import fs from 'fs';
import TimedStore from 'timed-store';
import cli from 'cli';

const WHITELIST = 'whitelist';
const BLACKLIST = 'blacklist';
const CAMPAIGNS = CAMPAIGNS;

cli.enable('status');

const options = cli.parse({
    cmd: ['c', '{fetch|build_lists|stat}', 'string']
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

const objectById = (data, id) => {
    return data.find(elem => elem.id === id);
}

if(options.cmd === 'fetch') {
    binom.getCampaignList()
    .then(result => {
        result = result.map(campaign => processCampaign(campaign));
        console.log(`got ${result.length} campaigns`);
        store.addDataPoint(CAMPAIGNS, result);
        cli.ok('fetch complete');
        process.exit(0);
    })
    .catch(err => {
        console.error(err.toString());
        process.exit(1);
    });
} else if(options.cmd === 'build_lists') {
    const { timestamp, set } = store.getLatest(CAMPAIGNS);
    if(!set) { cli.fatal('no fetched data') }
    const date = new Date(+timestamp);
    console.log(`working at ${date.toString()}`);

    let wl = [];
    let bl = [];

    set.map(campaign => {
        if(needsWhitelisting(campaign)) {
            wl.push(campaign.id);
        }
        if(needsBlacklisting(campaign)) {
            bl.push(campaign.id);
        }
    })
    store.addDataPoint(WHITELIST, wl);
    store.addDataPoint(BLACKLIST, bl);

    process.exit(0);
} else if(options.cmd === 'stat') {
    const { set: campaigns } = store.getLatest(CAMPAIGNS);
    const { set: wl, timestamp: wlts } = store.getLatest(WHITELIST);
    const { set: bl, timestamp: blts } = store.getLatest(BLACKLIST);

    if(!campaigns || !wl || !bl) {
        cli.fatal('no fetched data')
    }

    console.log(`Whitelisted at ${new Date(+wlts).toString()}:`);
    wl.map(id => console.log(`  ${objectById(campaigns, id).name}`));
    console.log(`  ${wl.length} total`);

    console.log(`Blacklisted at ${new Date(+blts).toString()}:`);
    bl.map(id => console.log(`  ${objectById(campaigns, id).name}`));
    console.log(`  ${bl.length} total`);

    process.exit(0);
} else {
    cli.fatal(`unknown cmd: ${options.cmd}`)
}
