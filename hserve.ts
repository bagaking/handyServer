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
    .option('l', {
        alias: 'log',
        demand: false,
        default: false,
        describe: 'whether it should print log',
        type: 'boolean'
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


if(argv.log) {
    app.use(require('morgan')('short'));
}

app.use("/", express.static(servePath));

let mockPath : string;
let mockFiles : Map<string, any>;
if(!!argv.mock){
    mockPath = Path.join(rootPath, argv.mock);
    const files = fs
        .readdirSync(mockPath)
        .filter(file => !file.match(/\..*\.swp/));
    mockFiles = new Map<string, any>();
    files.forEach(file => {
        let filename :string = Path.parse(file).name;
        mockFiles.set(filename, require(Path.join(mockPath,file)));
        app.get(`/api/${filename}/`, function (req, res) {
            res.send(JSON.stringify(mockFiles.get(filename)));
        });
    })
}

app.listen(port, () => {
    console.log('**** Service Preparing ****\n');
    console.log(`- Root path : ${rootPath}`);
    console.log(`
- Serve : 
    - path : ${servePath} 
    - at : http://localhost:${port}/
`);

    if(!mockPath){
        console.log('- Mock : off');
    }else{
        console.log(`
- Mock :
    - path : ${mockPath}
    - at : http://localhost:${port}/api/
    - api :`);
        mockFiles.forEach((_,i) =>{
            console.log(`       - /api/${i}/`);
        })
        console.log('');
    }


    console.log('- Log :', argv.log ? "on" : "off", '\n')
    console.log('**** Service Running ******\n');
});


