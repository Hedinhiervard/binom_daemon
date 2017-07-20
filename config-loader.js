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
        }
        return content;
    });
    }

    parseGroupings(groupings) {
        if(!Array.isArray(groupings) || groupings.length > 3) {
            throw new Error('groupings must be an array of <= 3 elements');
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
}
