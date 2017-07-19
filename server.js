import express from 'express';
import ListBuilder from 'list-builder';
import fs from 'fs';
import schedule from 'schedule';
import dotenv from 'dotenv';
import ConfigLoader from 'config-loader';

dotenv.config();

let expressApp = express();
let timer;
let lastConfig;

const port = process.env.PORT || 8080;

const buildLists = () => {
    console.log('building lists');
    return new ConfigLoader().loadConfig(process.env.CONFIG_FILE_URL)
    .then(config => {
        lastConfig = config;
        return new ListBuilder(process.env.MONGODB_URI, config.API)
        .init();
    })
    .then(listBuilder => listBuilder.buildLists(lastConfig.rules))
    .then(lists => {
        if(timer) timer.stop();
        console.log(`rescheduling update at ${lastConfig.listBuildInterval}`);
        timer = schedule.every(lastConfig.listBuildInterval).do(() => {
            buildLists();
        });
    })
    .catch(err => {
        console.error(err.toString(), err.stack);
        console.error('error building list, rescheduling update in 1 min');
        if(timer) {
            timer.stop();
        }
        timer = schedule.every('1 min').do(() => {
            buildLists();
        });
    });
}

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

expressApp.get('/report', (req, res, next) => {
    new ConfigLoader().loadConfig(process.env.CONFIG_FILE_URL)
    .then(config => {
        return new ListBuilder(process.env.MONGODB_URI, config.API).init();
    })
    .then(listBuilder => listBuilder.getLatest())
    .then(({timestamp, set: lists}) => {
        res.send(lists);
        next();
    });
});

expressApp.get('/build', (req, res, next) => {
    buildLists()
    .then(lists => {
        res.send(lists);
        next();
    })
    .catch(err => {
        console.error(err.toString(), err.stack);
    });
});

promisifySingle(expressApp.listen.bind(expressApp), port)
.then(() => {
    console.log(`listening on ${port}`);
})
.then(() => buildLists())
.catch(err => {
    console.error(err.toString(), err.stack);
});
