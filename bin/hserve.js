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
var walk_1 = __importDefault(require("walk"));
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
var indexMode = argv.index.toLowerCase();
if (indexMode !== 'off') {
    app.get("/--index--", function (req, res) {
        var files = [];
        var walker = walk_1.default.walk(servePath, { followLinks: false });
        walker.on('file', function (root, stat, next) {
            var route = root.replace(servePath, "");
            var file = stat;
            if (indexMode === "name") {
                files.push(indexMode === "name" ? path_1.default.join(route, file.name) : { route: route, file: file });
            }
            next();
        });
        walker.on('end', function () {
            res.send(files);
        });
    });
}
var mockPath;
var mockFiles;
if (!!argv.mock) {
    mockPath = path_1.default.join(rootPath, argv.mock);
    mockFiles = new Map();
    var mockFile_1 = function (path, routeParent) {
        if (routeParent === void 0) { routeParent = ''; }
        console.log("load", path);
        var fstat = fs_1.default.lstatSync(path);
        var filename = path_1.default.parse(path).name;
        var route = (routeParent) ? path_1.default.join(routeParent, filename) : "/api";
        if (fstat.isDirectory()) {
            console.log("dir", path);
            var files = fs_1.default.readdirSync(path).filter(function (file) { return !file.match(/\..*\.swp/); });
            files.forEach(function (file) { return mockFile_1(path_1.default.join(path, file), route); });
        }
        else if (fstat.isFile()) {
            console.log("file", path);
            mockFiles.set(route, path);
            app.get(route, function (req, res) {
                res.send(JSON.stringify(require(mockFiles.get(route))));
            });
        }
    };
    mockFile_1(mockPath);
}
app.listen(port, function () {
    console.log('**** Service Preparing ****\n');
    console.log("- Root path : " + rootPath);
    console.log("\n- Serve : \n    - path : " + servePath + " \n    - at : http://localhost:" + port + "/\n");
    if (!mockPath) {
        console.log('- Mock : off\n');
    }
    else {
        console.log("\n- Mock :\n    - path : " + mockPath + "\n    - at : http://localhost:" + port + "/api/\n    - api :");
        mockFiles.forEach(function (_, i) {
            console.log("       - " + i);
        });
        console.log('');
    }
    console.log('- Log :', argv.log ? "on" : "off", '\n');
    console.log('- index :', argv.index, '\n');
    console.log('**** Service Running ******\n');
});
