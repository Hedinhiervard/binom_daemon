import fs from 'fs';
import cli from 'cli';
import ListBuilder from 'list-builder';

cli.enable('status');

const options = cli.parse({
    cmd: ['c', '{update_lists|print_lists}', 'string']
});

const configFileName = '.smrtmnk.com.json';

console.log(`loading config from ${configFileName}`);
const stringConfig = fs.readFileSync(configFileName, 'utf-8');
const config = JSON.parse(stringConfig);

if(options.cmd === 'update_lists') {
    const listBuilder = new ListBuilder(config.API);
    const lists = listBuilder.buildLists(config.rules)
    .then(lists => {
        console.log(lists);
        process.exit(0);
    });
} else {
    cli.fatal(`unknown cmd: ${options.cmd}`)
}
