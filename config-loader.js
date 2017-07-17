import fetch from 'node-fetch';

export default class ConfigLoader {
    loadConfig(url) {
        console.log(`loading config from ${url}`);
        return fetch(url, 'utf-8')
        .then(res => res.text())
        .then(content => {
            return JSON.parse(content);
        });
    }
}
