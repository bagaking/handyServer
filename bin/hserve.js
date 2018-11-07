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
var fs_1 = __importDefault(require("fs"));
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
var exp = require('express');
var app = exp();
var port = argv.port;
var root = argv._[0];
var rootPath = root ? (path_1.default.isAbsolute(root) ? root : path_1.default.join(process.cwd(), root)) : process.cwd();
var servePath = path_1.default.join(rootPath, argv.dir);
if (argv.log) {
    app.use(require('morgan')('short'));
}
app.use("/", express.static(servePath));
var mockPath;
var mockFiles;
if (!!argv.mock) {
    mockPath = path_1.default.join(rootPath, argv.mock);
    var files = fs_1.default
        .readdirSync(mockPath)
        .filter(function (file) { return !file.match(/\..*\.swp/); });
    mockFiles = new Map();
    files.forEach(function (file) {
        var filename = path_1.default.parse(file).name;
        mockFiles.set(filename, require(path_1.default.join(mockPath, file)));
        app.get("/api/" + filename + "/", function (req, res) {
            res.send(JSON.stringify(mockFiles.get(filename)));
        });
    });
}
app.listen(port, function () {
    console.log('**** Service Preparing ****\n');
    console.log("- Root path : " + rootPath);
    console.log("\n- Serve : \n    - path : " + servePath + " \n    - at : http://localhost:" + port + "/\n");
    if (!mockPath) {
        console.log('- Mock : off');
    }
    else {
        console.log("\n- Mock :\n    - path : " + mockPath + "\n    - at : http://localhost:" + port + "/api/\n    - api :");
        mockFiles.forEach(function (_, i) {
            console.log("       - /api/" + i + "/");
        });
        console.log('');
    }
    console.log('- Log :', argv.log ? "on" : "off", '\n');
    console.log('**** Service Running ******\n');
});
