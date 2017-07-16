import express from 'express';
import ListBuilder from 'list-builder';
import fs from 'fs';
import schedule from 'schedule';

let expressApp = express();

const configFileName = '.smrtmnk.com.json';

console.log(`loading config from ${configFileName}`);
const stringConfig = fs.readFileSync(configFileName, 'utf-8');
const config = JSON.parse(stringConfig);

const listBuilder = new ListBuilder(config.API);

expressApp.get('/report', (req, res, next) => {
    listBuilder.getLatest()
    .then(({timestamp, set: lists}) => {
        res.send(lists);
        next();
    });
});

expressApp.get('/build', (req, res, next) => {
    const lists = listBuilder.buildLists(config.rules)
    .then(lists => {
        res.send(lists);
        next();
    });
});

schedule.every(config.listBuildInterval).do(() => {
    console.log('building');
    listBuilder.buildLists(config.rules);
});

const port = process.env.PORT || 8080;
expressApp.listen(port);
console.log(`listening on ${port}`);
