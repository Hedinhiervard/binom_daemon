import axios from 'axios';

const fieldsOfInterest = {
    Level: { type: 'number', destination: 'level' },
    Name: { type: 'string', destination: 'name' },
    Clicks: { type: 'number', destination: 'clicks' },
    'LP Clicks': { type: 'number', destination: 'lpclicks' },
    'LP CTR': { type: 'number', destination: 'lpctr' },
    Leads: { type: 'number', destination: 'leads' },
    CR: { type: 'number', destination: 'cr' },
    EPC: { type: 'number', destination: 'epc' },
    CPC: { type: 'number', destination: 'cpc' },
    Revenue: { type: 'number', destination: 'revenue' },
    Spend: { type: 'number', 'destination': 'spend' },
    Profit: { type: 'number', 'destination': 'profit' },
    ROI: { type: 'number', destination: 'roi' }
}

/**
 * Provides access to the Binom web API
 */
export default class BinomAPIClient {
    /**
     * The default config to append to all requests
     * @type {Object}
     */
    config = null;

    /**
     * Create new Binom API client
     * @param  {Object} config - default config
     */

    constructor(config) {
        if(!config.baseURL) {
            throw new Error('no baseURL in config');
        }

        this.config = config;
    }

    /**
     * Generic method to call Binom API
     * @param  {Object} params - parameters to use
     * @return {Promise<Object>} - promised object with parsed data
     */
    makeAPIRequest(params, tempCookies = {}) {
        const targetCookies = Object.assign(tempCookies, this.config.cookies);

        let cookieString = '';
        for(const cookieName in targetCookies) {
            cookieString += `${cookieName}=${targetCookies[cookieName]}; `;
        }

        const api = axios.create({
            baseURL: this.config.baseURL,
            headers: {
                'cookie': cookieString
            }
        });

        params.api_key = this.config.api_key;
        params.timezone = this.config.timezone;
        params.val_page = 10000;
        return api.get('/', { params })
        .then(response => response.data);
    }

    /**
     * Requests the campaign list
     * @return {Promise<Object>} - list of campaigns with their properties
     */
    getCampaignList() {
        console.log('getting campaigns');
        return this.makeAPIRequest({ page: 'Campaigns' });
    }

    /**
     * Returns detailed entities list for the given campaign id and groupings
     * @param  {number} campaignID - campaign to request entities for
     * @param {Array<number>} groupings - array of grouping ids
     * @return {Array} - detailed list of entities
     */
    getEntitiesForCampaign(campaignID, groupings, date) {
        let params = {
            page: 'Stats',
            camp_id: campaignID,
            date
        };
        let cookies = {};

        let topIdx = 1;
        for(const idx in groupings) {
            params[`group${+idx + 1}`] = groupings[idx];
            topIdx = Math.max(topIdx, +idx + 1);
        }

        /* the unused groupXXX fields are set to 1 */
        topIdx++;
        for(; topIdx <= 3; topIdx++) {
            params[`group${topIdx}`] = 1;
        }

        console.log(`getting entities info for campaign ${campaignID}, groupings: ${groupings}, date: ${date}`);
        return this.makeAPIRequest(params, cookies)
        .then(entities => {
            /* parse nubmers and rename fields */
            entities = entities
            .map(entity => this.processEntity(entity, fieldsOfInterest));

            /* sum up names */
            let nameQueue = [];
            for(const idx in entities) {
                const entity = entities[idx];
                nameQueue[entity.level - 1] = entity.name;
                if(entity.level === groupings.length) {
                    entity.name = nameQueue.join(' :: ');
                }
            }

            /* filter out the non-bottom level entities, (i.e. category names) */
            entities = entities
            .filter(entity => entity.level === groupings.length)

            return entities;
        });
    }

    /**
     * This function post-process the entity received from API to parse integers, floats
     * and rename fields to comply with the scheme
     * @param {Object} entity object to proceess
     * @param {Object} table table of the properties to use
     * @return {Object} processed object
     */
    processEntity(entity, table) {
        let result = {};
        for(const field in table) {
            if(!entity[field]) {
                throw new Error(`entity misses field ${field}: ${JSON.stringify(entity, null, 4)}`);
            }
            result[table[field].destination] = entity[field];
            if(table[field].type === 'number') {
                result[table[field].destination] = parseFloat(result[table[field].destination]);
            }
        }
        return result;
    }
}
