import fs from 'fs';
import mongodb from 'mongodb'

/**
 * This class stores data points with their timestamps and performs various analytics
 */
export default class TimedStore {
    /**
     * MongoClient instance
     */
    db = null;

    /**
     * Create a new instance and load data
     * @param  {string} filename - a filename to store data in
     */
    constructor(mongodbURL) {
        this.mongodbURL = mongodbURL;
    }

    /**
     * Initialized the store
     * @return {Promise} pending operation
     */
    init() {
        return mongodb.MongoClient.connect(this.mongodbURL)
        .then(db => {
            this.db = db;
        })
    }

    /**
     * Adds a data point with `setID` at the current point in time
     * @param {string} setID - the data set id (e.g. `campaigns`)
     * @param {Object} data - data object
     */
    addDataPoint(setID, data) {
        const timestamp = Date.now();
        console.log(`adding ${setID} data set with at ${new Date(+timestamp).toString()}`);
        data.timestamp = timestamp;
        return this.db.collection(setID).insert(data);
    }

    /**
     * Returns the latest data set added
     * @param {string} setID - the set ID to get
     *
     */
    getLatest(setID) {
        return this.db.collection(setID).find({}).sort({'timestamp': -1}).limit(1).next()
        .then(result => {
            return { timestamp: result.timestamp, set: result };
        });
    }
}
