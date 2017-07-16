import fs from 'fs';
import cli from 'cli';
import ListBuilder from 'list-builder';
import dotenv from 'dotenv';

dotenv.config();

cli.enable('status');

const options = cli.parse({
    cmd: ['c', '{update_lists|print_lists}', 'string']
});

const configFileName = '.smrtmnk.com.json';

console.log(`loading config from ${configFileName}`);
const stringConfig = fs.readFileSync(configFileName, 'utf-8');
const config = JSON.parse(stringConfig);

const listBuilder = new ListBuilder(process.env.MONGODB_URI, config.API);

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

listBuilder.init()
.then(() => {
    console.log('list builder inited');
    parseOptions();
});
