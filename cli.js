import BinomAPIClient from 'binom-api-client';
import fs from 'fs';
import TimedStore from 'timed-store';
import cli from 'cli';
import Evaluator from 'evaluator';

const LIST_DATA = 'list_data';

cli.enable('status');

const options = cli.parse({
    cmd: ['c', '{update_lists|print_lists}', 'string']
});

const configFileName = '.smrtmnk.com.json';

console.log(`loading config from ${configFileName}`);
const stringConfig = fs.readFileSync(configFileName, 'utf-8');
const config = JSON.parse(stringConfig);

const binom = new BinomAPIClient(config);
const store = new TimedStore('store.json');
const evaluator = new Evaluator();

const publisherFieldsOfInterest = {
    Name: { type: 'string', destination: 'name' },
    'LP CTR': { type: 'number', destination: 'lpctr' },
    Clicks: { type: 'number', destination: 'clicks' },
    Leads: { type: 'number', destination: 'leads' },
    ROI: { type: 'number', destination: 'roi' }
}

const processEntity = (entity, table) => {
    let result = {};
    for(const field in table) {
        result[table[field].destination] = entity[field];
        if(table[field].type === 'number') {
            result[table[field].destination] = parseFloat(result[table[field].destination]);
        }
    }
    return result;
}

const objectById = (data, id) => {
    return data.find(elem => elem.id === id);
}

if(options.cmd === 'update_lists') {
    let promises = [];
    let listData = { wl: {}, bl: {} }

    for(const campaignID in config.rules) {
        let promise = binom.getPublishersForCampaign(campaignID)
        .then(publishers => {
            listData.wl[campaignID] = [];
            listData.bl[campaignID] = [];

            const wlEval = evaluator.compile(config.rules[campaignID].publisherWhitelistConditions);
            const blEval = evaluator.compile(config.rules[campaignID].publisherBlacklistConditions);

            for(let publisher of publishers) {
                publisher = processEntity(publisher, publisherFieldsOfInterest);

                if(wlEval(publisher)) {
                    console.log(`${publisher.name} (campaign ${campaignID}) is whitelisted`)
                    listData.wl[campaignID].push(publisher.name);
                }

                if(blEval(publisher)) {
                    console.log(`${publisher.name} (campaign ${campaignID}) is blacklisted`)
                    listData.bl[campaignID].push(publisher.name);
                }
            }
        })
        .catch(err => {
            console.log(err.toString(), err.stack)
        });
        promises.push(promise);
    }

    Promise.all(promises)
    .then(() => {
        store.addDataPoint(LIST_DATA, listData);
        console.log('all done');
        process.exit(0);
    })
// } else if(options.cmd === 'print_lists') {
//     const { set: campaigns } = store.getLatest(CAMPAIGNS);
//     const { set: wl, timestamp: wlts } = store.getLatest(WHITELIST);
//     const { set: bl, timestamp: blts } = store.getLatest(BLACKLIST);

//     if(!campaigns || !wl || !bl) {
//         cli.fatal('no fetched data')
//     }

//     console.log(`Whitelisted at ${new Date(+wlts).toString()}:`);
//     wl.map(id => console.log(`  ${objectById(campaigns, id).name}`));
//     console.log(`  ${wl.length} total`);

//     console.log(`Blacklisted at ${new Date(+blts).toString()}:`);
//     bl.map(id => console.log(`  ${objectById(campaigns, id).name}`));
//     console.log(`  ${bl.length} total`);

//     process.exit(0);
} else {
    cli.fatal(`unknown cmd: ${options.cmd}`)
}
