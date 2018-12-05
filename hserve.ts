#!/usr/bin/env node

import * as express from 'express';
import * as Argv from 'yargs'
import Path from 'path';
import fs from 'fs';
import walk from 'walk';

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
    }).option('i', {
        alias: 'index',
        demand: false,
        default: 'name',
        describe: 'provide get api /--index-- to provide index of folder. \nAvailable modes : [off], [name], [detail]\n',
        type: 'string'
    })
    .usage('Usage: hserve PATH [OPTIONS]')
    .example('hserve', 'serve current-folder, at the port 3000.')
    .example('hserve ..', 'serve parent-folder, at the port 3000.')
    .example('hserve /var/www/html -l', 'serve the folder "/var/www/html" with logs, at the port 3000.')
    .example('hserve /var/www -d my_blog -p 80', 'serve the folder "/var/www/my_blog", at the port 80.')
    .example('hserve /var/www -m mock', 'serve the folder "/var/www/" and mock the folder "/var/www/mock", at the 3000.')
    .help('h').alias("h", "help")
    .epilog('Copyright 2018')
    .argv;

const exp = require('express');

const app: express.Application = exp();
const port: number = argv.port;
const root : string = argv._[0];

const rootPath: string = root ? (Path.isAbsolute(root) ? root : Path.join(process.cwd(), root)) : process.cwd();
const servePath = Path.join(rootPath, argv.dir);


if(argv.log) {
    app.use(require('morgan')('short'));
}

app.use("/", express.static(servePath));

const indexMode : string = argv.index.toLowerCase();
if(indexMode !== 'off') {
    app.get("/--index--", function (req, res) {
        let files: Array<string|object> = [];
        let walker = walk.walk(servePath, {followLinks: false});
        walker.on('file', function (root, stat, next) {
            let route = root.replace(servePath, "");
            let file = stat;
            if(indexMode === "name") {
                files.push(indexMode === "name" ? Path.join(route, file.name) : {route, file });
            }
            next();
        });
        walker.on('end', function () {
            res.send(files);
        });
    })
}


let mockPath : string;
let mockFiles : Map<string, any>;
if(!!argv.mock){
    mockPath = Path.join(rootPath, argv.mock);
    mockFiles = new Map<string, any>();

    const mockFile = (path: string, routeParent : string = '') => {

        console.log("load", path);

        let fstat = fs.lstatSync(path);
        let filename :string = Path.parse(path).name;
        let route = (routeParent) ? Path.join(routeParent, filename) : "/api";

        if(fstat.isDirectory()){
            console.log("dir", path);
            const files = fs.readdirSync(path).filter(file => !file.match(/\..*\.swp/));
            files.forEach(file => mockFile(Path.join(path, file), route));
        }else if(fstat.isFile()){
            console.log("file", path);
            mockFiles.set(route, path);
            app.get(route, function (req, res) {
                res.send(JSON.stringify(require(mockFiles.get(route))));
            });
        }
    }

    mockFile(mockPath);
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
        console.log('- Mock : off\n');
    }else{
        console.log(`
- Mock :
    - path : ${mockPath}
    - at : http://localhost:${port}/api/
    - api :`);
        mockFiles.forEach((_,i) =>{
            console.log(`       - ${i}`);
        })
        console.log('');
    }


    console.log('- Log :', argv.log ? "on" : "off", '\n')
    console.log('- index :', argv.index, '\n')
    console.log('**** Service Running ******\n');
});


