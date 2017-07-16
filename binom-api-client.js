import axios from 'axios';

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
        this.api = axios.create({
            baseURL: this.config.baseURL
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
}
