import fs from 'fs';
import cli from 'cli';
import ListBuilder from 'list-builder';
import dotenv from 'dotenv';
import ConfigLoader from 'config-loader';

dotenv.config();

cli.enable('status');

let config;
let listBuilder;

const options = cli.parse({
    cmd: ['c', '{update_lists|print_lists}', 'string']
});

new ConfigLoader().loadConfig(process.env.CONFIG_FILE_URL)
.then(result => {
    config = result
    listBuilder = new ListBuilder(process.env.MONGODB_URI, config.API);
    return listBuilder.init();
})
.then(() => {
    console.log('list builder inited');
    parseOptions();
});

const parseOptions = () => {
    if(options.cmd === 'update_lists') {
        listBuilder.buildLists(config.rules)
        .then(lists => {
            console.log(lists);
            process.exit(0);
        })
        .catch(err => {
            console.log(err.toString(), err.stack);
            process.exit(1);
        });
    } else if(options.cmd === 'print_lists') {
        listBuilder.getLatest()
        .then(({set: lists}) => {
            console.log(lists);
            process.exit(0);
        })
        .catch(err => {
            console.log(err.toString(), err.stack);
            process.exit(1);
        });
    } else {
        cli.fatal(`unknown cmd: ${options.cmd}`)
    }
}
