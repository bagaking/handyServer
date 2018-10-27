#!/usr/bin/env node

import * as express from 'express';
import * as Argv from 'yargs'
import Path from 'path';

const argv = Argv
    .option('d', {
        alias: 'dir',
        demand: false,
        default: null,
        describe: 'static path to serve',
        type: 'string'
    })
    .option('p', {
        alias: 'port',
        demand: false,
        default: '3000',
        describe: 'port the service on',
        type: 'string'
    })
    .usage('Usage: hserve [options]')
    .example('hserve -d /var/www/my_blog -p 80', 'serve the folder "my_blog" at port 80.')
    .help('h').alias("h", "help")
    .epilog('Copyright 2018')
    .argv;

const exp = require('express')

const app: express.Application = exp();
const port: number = argv.port;
const path: string =
    argv.dir ? (Path.isAbsolute(argv.dir)
        ? argv.dir
        : Path.join(process.cwd(), argv.dir))
        : process.cwd();

app.use(express.static(path));
app.listen(port, () => {
    console.log(
        `
**** Server Start ****
Serve path : ${path} 
Listening at : http://localhost:${port}/
**********************
`
    );
});

