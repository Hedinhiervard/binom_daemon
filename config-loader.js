import fetch from 'node-fetch';

const groupingIDs = {
    'paths': 2,
    'offers': 3,
    'landers': 4,
    'rules': 5,
    'isp': 6,
    'ip': 7,
    'ip-range-1.2.3.xxx': 8,
    'ip-range-1.2.xxx.xxx': 9,
    'device-type': 10,
    'device-name': 29,
    'device-brand': 11,
    'device-model': 12,
    'screen-resolution': 13,
    'connection-speed': 14,
    'browser-name': 15,
    'OS': 17,
    'OS w/version': 18,
    'country': 19,
    'language': 21,
    'aff-network': 22,
    'referer-domain': 23,
    'referer-url': 24,
    'day-of-week': 25,
    'hour-of-day': 26,
    'days': 31,
    't1': 27,
    't2': 282,
    't3': 283,
    't4': 284,
    't5': 285,
    't6': 286,
    't7': 287,
    't8': 288,
    't9': 289
};

const dateIDs = {
    'today': 1,
    'yesterday': 2,
    'last-7-days': 3,
    'last-14-days': 4,
    'current-month': 5,
    'last-month': 6,
    'current-year': 7,
    'last-year': 8,
    'all-time': 9,
    'current-week': 11
}

export default class ConfigLoader {
    loadConfig(url) {
        console.log(`loading config from ${url}`);
        return fetch(url, 'utf-8')
    .then(res => res.text())
    .then(content => {
        return JSON.parse(content);
    })
    .then(content => {
        for(let campaignID in content.rules) {
            let rule = content.rules[campaignID];
            rule.groupings = this.parseGroupings(rule.groupings);
            rule.date = this.parseDate(rule.date);
        }
        return content;
    });
    }

    /**
     * Parses groupings value from textual to id representation
     * @param  {Array} groupings array of string values
     * @example ['t1', 'country', 'language']
     * @return {Array} array of id values
     * @example [19, 17, 1]
     */
    parseGroupings(groupings) {
        if(!Array.isArray(groupings) || groupings.length > 3) {
            throw new Error(`groupings must be an array of <= 3 elements, got: ${groupings}`);
        }
        let result = [];
        for(const grouping of groupings) {
            const idx = groupingIDs[grouping];
            if(idx === undefined) {
                throw new Error(`unknown grouping ${grouping}`);
            }
            result.push(idx);
        }
        return result;
    }

    /**
     * Parses date value from textual to id representation
     * @param  {string} date date value as string
     * @example 'today'
     * @return {number} date value as id
     * @example 1
     */
    parseDate(date) {
        if(typeof date !== 'string') {
            throw new Error(`date must be string, got: ${date}`);
        }
        const idx = dateIDs[date];
        if(idx === undefined) {
            throw new Error(`unknown date ${date}`);
        }
        return idx;
    }
}
