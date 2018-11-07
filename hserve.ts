#!/usr/bin/env node

import * as express from 'express';
import * as Argv from 'yargs'
import Path from 'path';
import fs from 'fs';

const argv = Argv
    .option('d', {
        alias: 'dir',
        demand: false,
        default: '.',
        describe: 'relative path to serve',
        type: 'string'
    })
    .option('m', {
        alias: 'mock',
        demand: false,
        default: null,
        describe: 'relative path to mock',
        type: 'string'
    })
    .option('p', {
        alias: 'port',
        demand: false,
        default: '3000',
        describe: 'port the service on',
        type: 'string'
    })
    .usage('Usage: hserve PATH [OPTIONS]')
    .example('hserve /var/www/my_blog', 'serve the folder "my_blog" at port 3000.')
    .example('hserve /var/www -d my_blog -p 80', 'serve the folder "my_blog" at port 80.')
    .help('h').alias("h", "help")
    .epilog('Copyright 2018')
    .argv;

const exp = require('express')

const app: express.Application = exp();
const port: number = argv.port;
const root : string = argv._[0];

const rootPath: string = root ? (Path.isAbsolute(root) ? root : Path.join(process.cwd(), root)) : process.cwd();
const servePath = Path.join(rootPath, argv.dir);

app.use("/", express.static(servePath));

let mockPath : string;
if(!!argv.mock){
    mockPath = Path.join(rootPath, argv.mock);



}
console.log(argv.mock)


app.listen(port, () => {
    console.log('**** Service Preparing ****\n');
    console.log(`- Root path : ${rootPath}`);
    console.log(`
- Serve : 
    - path : ${servePath} 
    - at : http://localhost:${port}/
`);
    console.log(!mockPath ? '- Mock : off\n' :
`
- Mock :
    - path : ${mockPath}
    - at : http://localhost:${port}/api/
`)
    console.log('**** Service Running ******\n');
});


