#!/usr/bin/env node

import * as express from 'express';
import * as Argv from 'yargs'
import Path from 'path';

import bodyParser from 'body-parser'

let pkg = require('./package.json');

import Collecting from './src/collecting'
import { indexingPath } from './src/indexing'
import { mockingPath } from './src/mocking'
import cors from 'cors'

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
    .option('i', {
        alias: 'index',
        demand: false,
        default: 'name',
        describe: 'provide get api /--index-- to provide index of folder. \nAvailable modes : [off], [name], [detail]\n',
        type: 'string'
    }).option('c', {
        alias: 'collect',
        demand: false,
        default: '',
        describe: 'mongoDb connection string for collecting logs',
        type: 'string'
    })
    .usage('Usage: hserve PATH [OPTIONS]')
    .example('hserve', 'serve current-folder, at the port 3000.')
    .example('hserve ..', 'serve parent-folder, at the port 3000.')
    .example('hserve /var/www/html -l', 'serve the folder "/var/www/html" with logs, at the port 3000.')
    .example('hserve /var/www -d my_blog -p 80', 'serve the folder "/var/www/my_blog", at the port 80.')
    .example('hserve /var/www -m mock', 'serve the folder "/var/www/" and mock the folder "/var/www/mock", at the 3000.')
    .example('hserve -c mongodb://localhost/logs', 'create logging server based on mongodb.')
    .help('h').alias("h", "help")
    .version(pkg.version)
    .epilog('Copyright 2018')
    .argv;

import exp = require('express');

const app: express.Application = exp();
const port: number = argv.port;
const root: string = argv._[0];

const rootPath: string = root ? (Path.isAbsolute(root) ? root : Path.join(process.cwd(), root)) : process.cwd();
const servePath = Path.join(rootPath, argv.dir);

app.use(bodyParser.urlencoded())
app.use(bodyParser.json())

if (argv.log) {
    app.use(require('morgan')('short'));
}

app.use(cors())

let requires: any = {_ALL_: 0}
app.use(function (req, res, next) {

    if (!requires[req.originalUrl]) requires[req.originalUrl] = 1;
    else requires[req.originalUrl] += 1;
    requires._ALL_ += 1;
    if (requires._ALL_ % 1000 == 1) console.log(requires, Date.now(), new Date()) // print state every 1000 entries

    next();
});

app.use("/", express.static(servePath));

app.get("/--info--", function (req, res) {
    res.status(201).end(JSON.stringify(pkg, null,4));
});

const indexMode: string = argv.index.toLowerCase();
if (indexMode !== 'off') {
    app.get("/--index--", async function (req, res) {
        res.send(await indexingPath("name", servePath));
    })
}


let mockPath: string;
let mockFiles: Map<string, any>;
if (!!argv.mock) {
    mockPath = Path.join(rootPath, argv.mock);
    mockFiles = mockingPath(mockPath);
    // console.log(mockPath, mockFiles);

    mockFiles.forEach((value, route) => {
        console.log("mock", route, value)
        let routeAll = Path.join("/api", route)
        app.get(routeAll, function (req, res) {
            res.send(JSON.stringify(require(value)));
        });
    })
}

if (!!argv.collect && argv.collect !== '') {
    let collecting = new Collecting(argv.collect);

    app.get('/--collect--/add/:tag', function (req, res) {
        let msg = decodeURIComponent(req.query.msg || '');
        collecting.add(req.params.tag, msg, req.query.level || 'log', function (e: any) {
            if (e) return res.status(500).end(e.stack);
            res.status(201).end(`${req.params.tag} : ${msg} are collected.`);
        })
    });

    app.post('/--collect--/add/:tag', function (req, res) {
        console.log(req.body)
        let msg = decodeURIComponent(req.body.msg || '');
        collecting.add(req.params.tag, msg, req.body.level || 'log', function (e: any) {
            if (e) return res.status(500).end(e.stack);
            res.status(201).end(`${req.params.tag} : ${msg} are collected.`);
        })
    });

    app.get('/--collect--/get/:tag?', async function (req, res) {
        let collections: any = await collecting.get(req.params.tag, req.query.level, req.query.time_from, req.query.time_to, function (e: any) {
            res.status(500).end(e.stack);
        })
        if (collections.length === 0) {
            res.status(201).end('empty');
        } else {
            collections.forEach(function (c: any) {
                c.dateISOStr = c.date.toISOString();
            })
            res.status(201).end(JSON.stringify({collections}));
        }
    });
}

app.listen(port, () => {
    console.log(`==== Service Preparing (ver:${pkg.version}) =====`);
    console.log('==>\n');
    console.log(`- Root path : ${rootPath}`);
    console.log(`
- Serve : 
    - path : ${servePath} 
    - at : http://localhost:${port}/
    - info : http://localhost:${port}/--info--`);

    if (!mockPath) {
        console.log('- Mock : off\n');
    } else {
        console.log(`
- Mock :
    - path : ${mockPath}
    - at : http://localhost:${port}/api/
    - api :`);
        mockFiles.forEach((_, i) => {
            console.log(`       - ${i}`);
        })
        console.log('');
    }


    console.log('- Log :', argv.log ? "on" : "off", '\n')
    console.log(
        `- index : ${argv.index} 
    - at : http://localhost:${port}/--index--
    `
    )

    console.log(
    `- collect : ${argv.collect ? 'on' : 'off'}
    - mongo : ${argv.collect}
    - add : http://localhost:${port}/--collect--/add/:tag?msg=&level=
    - get : http://localhost:${port}/--collect--/get/:tag?level=
    `)

    console.log('**** Service Running ******\n');
});


export * from './src/collecting'
export * from './src/indexing'
export * from './src/mocking'

