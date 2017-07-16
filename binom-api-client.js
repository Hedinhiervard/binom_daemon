import axios from 'axios';

const publisherFieldsOfInterest = {
    Name: { type: 'string', destination: 'name' },
    'LP CTR': { type: 'number', destination: 'lpctr' },
    Clicks: { type: 'number', destination: 'clicks' },
    Leads: { type: 'number', destination: 'leads' },
    ROI: { type: 'number', destination: 'roi' }
}

/**
 * Provides access to the Binom web API
 */
export default class BinomAPIClient {
    /**
     * Axios instance to use
     * @type {axios}
     */
    api = null;

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
        this.config = config;
        let cookieString = '';
        for(const cookieName in config.cookies) {
            cookieString += `${cookieName}=${config.cookies[cookieName]}; `;
        }
        this.api = axios.create({
            baseURL: this.config.baseURL,
            headers: {
                'cookie': cookieString
            }
        });
    }

    /**
     * Generic method to call Binom API
     * @param  {Object} params - parameters to use
     * @return {Promise<Object>} - promised object with parsed data
     */
    makeAPIRequest(params) {
        params.api_key = this.config.api_key;
        params.timezone = this.config.timezone;
        return this.api.get('/', { params })
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
     * Returns detailed publishers list for the given campaign id
     * @param  {number} campaignID - campaign to request publishers for
     * @return {Array} - detailed list of publishers
     */
    getPublishersForCampaign(campaignID) {
        console.log(`getting publishers info for campaign ${campaignID}`);
        return this.makeAPIRequest({ page: 'Stats', camp_id: campaignID })
        .then(publishers => publishers.map(publisher => this.processPublisher(publisher)));
    }

    /**
     * This function post-process the entity received from API to parse integers, floats
     * and rename field to the scheme
     * @param {Object} entity object to proceess
     * @param {Object} table table of the properties to use
     * @return {Object} processed object
     */
    processEntity(entity, table) {
        let result = {};
        for(const field in table) {
            result[table[field].destination] = entity[field];
            if(table[field].type === 'number') {
                result[table[field].destination] = parseFloat(result[table[field].destination]);
            }
        }
        return result;
    }

    /**
     * This function post-process the PUBLISHER received from API to parse integers, floats
     * and rename field to the scheme
     * @param {Object} entity object to proceess
     * @param {Object} table table of the properties to use
     * @return {Object} processed object
     */
    processPublisher(publisher) {
        return this.processEntity(publisher, publisherFieldsOfInterest);
    }
}
