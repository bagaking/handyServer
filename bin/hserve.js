#!/usr/bin/env node
"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express = __importStar(require("express"));
var Argv = __importStar(require("yargs"));
var path_1 = __importDefault(require("path"));
var argv = Argv
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
var exp = require('express');
var app = exp();
var port = argv.port;
var root = argv._[0];
var rootPath = root ? (path_1.default.isAbsolute(root) ? root : path_1.default.join(process.cwd(), root)) : process.cwd();
var servePath = path_1.default.join(rootPath, argv.dir);
app.use("/", express.static(servePath));
var mockPath;
if (!!argv.mock) {
    mockPath = path_1.default.join(rootPath, argv.mock);
}
console.log(argv.mock);
app.listen(port, function () {
    console.log('**** Service Preparing ****\n');
    console.log("- Root path : " + rootPath);
    console.log("\n- Serve : \n    - path : " + servePath + " \n    - at : http://localhost:" + port + "/\n");
    console.log(!mockPath ? '- Mock : off\n' :
        "\n- Mock :\n    - path : " + mockPath + "\n    - at : http://localhost:" + port + "/api/\n");
    console.log('**** Service Running ******\n');
});
