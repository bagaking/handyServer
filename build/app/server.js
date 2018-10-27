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
var exp = require('express');
var app = exp();
var port = argv.port;
var path = argv.dir ? (path_1.default.isAbsolute(argv.dir)
    ? argv.dir
    : path_1.default.join(process.cwd(), argv.dir))
    : process.cwd();
app.use(express.static(path));
app.listen(port, function () {
    console.log("\n**** Server Start ****\nServe path : " + path + " \nListening at : http://localhost:" + port + "/\n**********************\n");
});
