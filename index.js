import BinomAPIClient from 'binom-api-client';
import fs from 'fs';
import TimedStore from 'timed-store';

const configFileName = '.smrtmnk.com.json';

console.log(`loading config from ${configFileName}`);
const stringConfig = fs.readFileSync(configFileName, 'utf-8');
const config = JSON.parse(stringConfig);

const binom = new BinomAPIClient(config);
const store = new TimedStore('store.json');

binom.getCampaignList()
.then(result => {
    result = result.map(({id, name, LP_CTR}) => ({id, name, LP_CTR}));
    console.log(`got ${result.length} campaigns`);
    store.addDataPoint('campaigns', result);
});
