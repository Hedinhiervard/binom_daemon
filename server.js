import express from 'express';
import ListBuilder from 'list-builder';
import fs from 'fs';
import schedule from 'schedule';
import dotenv from 'dotenv';

dotenv.config();

let expressApp = express();

const configFileName = '.smrtmnk.com.json';

console.log(`loading config from ${configFileName}`);
const stringConfig = fs.readFileSync(configFileName, 'utf-8');
const config = JSON.parse(stringConfig);

const listBuilder = new ListBuilder(process.env.MONGODB_URI, config.API);
const port = process.env.PORT || 8080;

const promisifySingle = (f, param) => {
    return new Promise((resolve, reject) => {
        try {
            f(param, result => {
                resolve(result);
            });
        } catch(err) {
            reject(err);
        }
    });
}

listBuilder.init()
.then(() => {
    expressApp.get('/report', (req, res, next) => {
        listBuilder.getLatest()
        .then(({timestamp, set: lists}) => {
            res.send(lists);
            next();
        });
    });

    expressApp.get('/build', (req, res, next) => {
        const lists = listBuilder.buildLists(process.env.MONGODB_URI, config.rules)
        .then(lists => {
            res.send(lists);
            next();
        });
    });

    schedule.every(config.listBuildInterval).do(() => {
        console.log('building');
        listBuilder.buildLists(config.rules);
    });
})
.then(() => promisifySingle(expressApp.listen.bind(expressApp), port))
.then(() => {
    console.log(`listening on ${port}`);
});
