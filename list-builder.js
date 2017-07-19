import Evaluator from 'evaluator';
import BinomAPIClient from 'binom-api-client';
import TimedStore from 'timed-store';

export const LIST_DATA = 'list_data';

/**
 * Parses data from the API and build white- and blacklists
 */
export default class ListBuilder {
    /**
     * BinomAPIClient instnace
     * @type {BinomAPIClient}
     */
    binom = null;

    /**
     * Evaluator instance to evaluate boolean expression
     * @type {Evaluator}
     */
    evaluator = null;

    /**
     * TimedStore instance to store results to
     * @type {TimedStore}
     */
    store = null;

    /**
     * Creates a ListBuilder instance
     * @param {string} mongodbURL URL to connect to mongodb instance
     * @param  {[type]} apiConfig config to pass to BinomAPIClient
     */
    constructor(mongodbURL, apiConfig) {
        this.binom = new BinomAPIClient(apiConfig);
        this.store = new TimedStore(mongodbURL);
        this.evaluator = new Evaluator();
    }

    /**
     * Initialized the list builder
     * @return {Promise} pending operation
     */
    init() {
        return this.store.init()
        .then(() => this);
    }

    /**
     * Returns the latest black and whitelists
     * @return {Object} object containing `wl` and `bl` fields
     */
    getLatest() {
        return this.store.getLatest(LIST_DATA);
    }

    /**
     * Builds white- and blacklist according to rules
     * @param {Object} rules list of rules index by campaign id
     * @return {Object} object with `wl` and `bl` fields
     */
    buildLists(rules) {
        let promises = [];
        let listData = { wl: {}, bl: {} }

        for(const campaignID in rules) {
            const rule = rules[campaignID];
            let promise = this.binom.getEntitiesForCampaign(campaignID, rule.groupings)
            .then(entities => {
                listData.wl[campaignID] = [];
                listData.bl[campaignID] = [];

                const wlEval = this.evaluator.compile(rules[campaignID].whitelistConditions);
                const blEval = this.evaluator.compile(rules[campaignID].blacklistConditions);

                for(let entity of entities) {
                    if(wlEval(entity)) {
                        console.log(`${entity.name} (campaign ${campaignID}) is whitelisted`)
                        listData.wl[campaignID].push(entity.name);
                    }

                    if(blEval(entity)) {
                        console.log(`${entity.name} (campaign ${campaignID}) is blacklisted`)
                        listData.bl[campaignID].push(entity.name);
                    }
                }
            })
            .catch(err => {
                console.log(err.toString(), err.stack)
            });
            promises.push(promise);
        }

        return Promise.all(promises)
        .then(() => {
            return this.store.addDataPoint(LIST_DATA, listData);
        })
        .then(() => listData);
    }
}
