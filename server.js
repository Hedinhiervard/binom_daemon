import express from 'express';
import ListBuilder from 'list-builder';
import fs from 'fs';
import schedule from 'schedule';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

let expressApp = express();

const configFileName = '.smrtmnk.com.json';

console.log(`loading config from ${process.env.CONFIG_FILE_URL}`);

let listBuilder;

const port = process.env.PORT || 8080;
let config;

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

fetch(process.env.CONFIG_FILE_URL, 'utf-8')
.then(res => res.text())
.then(content => {
    config = JSON.parse(content);
    listBuilder = new ListBuilder(process.env.MONGODB_URI, config.API);
    return listBuilder.init()
})
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
