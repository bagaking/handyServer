#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
var body_parser_1 = __importDefault(require("body-parser"));
var pkg = require('./package.json');
var collecting_1 = __importDefault(require("./src/collecting"));
var indexing_1 = require("./src/indexing");
var mocking_1 = require("./src/mocking");
var cors_1 = __importDefault(require("cors"));
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
var exp = require("express");
var app = exp();
var port = argv.port;
var root = argv._[0];
var rootPath = root ? (path_1.default.isAbsolute(root) ? root : path_1.default.join(process.cwd(), root)) : process.cwd();
var servePath = path_1.default.join(rootPath, argv.dir);
app.use(body_parser_1.default.urlencoded());
app.use(body_parser_1.default.json());
if (argv.log) {
    app.use(require('morgan')('short'));
}
app.use(cors_1.default());
var requires = { _ALL_: 0 };
app.use(function (req, res, next) {
    if (!requires[req.originalUrl])
        requires[req.originalUrl] = 1;
    else
        requires[req.originalUrl] += 1;
    requires._ALL_ += 1;
    if (requires._ALL_ % 1000 == 1)
        console.log(requires, Date.now(), new Date()); // print state every 1000 entries
    next();
});
app.use("/", express.static(servePath));
app.get("/--info--", function (req, res) {
    res.status(201).end(JSON.stringify(pkg, null, 4));
});
var indexMode = argv.index.toLowerCase();
if (indexMode !== 'off') {
    app.get("/--index--", function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _b = (_a = res).send;
                        return [4 /*yield*/, indexing_1.indexingPath("name", servePath)];
                    case 1:
                        _b.apply(_a, [_c.sent()]);
                        return [2 /*return*/];
                }
            });
        });
    });
}
var mockPath;
var mockFiles;
if (!!argv.mock) {
    mockPath = path_1.default.join(rootPath, argv.mock);
    mockFiles = mocking_1.mockingPath(mockPath);
    // console.log(mockPath, mockFiles);
    mockFiles.forEach(function (value, route) {
        console.log("mock", route, value);
        var routeAll = path_1.default.join("/api", route);
        app.get(routeAll, function (req, res) {
            res.send(JSON.stringify(require(value)));
        });
    });
}
if (!!argv.collect && argv.collect !== '') {
    var collecting_2 = new collecting_1.default(argv.collect);
    app.get('/--collect--/add/:tag', function (req, res) {
        var msg = decodeURIComponent(req.query.msg || '');
        collecting_2.add(req.params.tag, msg, req.query.level || 'log', function (e) {
            if (e)
                return res.status(500).end(e.stack);
            res.status(201).end(req.params.tag + " : " + msg + " are collected.");
        });
    });
    app.post('/--collect--/add/:tag', function (req, res) {
        console.log(req.body);
        var msg = decodeURIComponent(req.body.msg || '');
        collecting_2.add(req.params.tag, msg, req.body.level || 'log', function (e) {
            if (e)
                return res.status(500).end(e.stack);
            res.status(201).end(req.params.tag + " : " + msg + " are collected.");
        });
    });
    app.get('/--collect--/get/:tag?', function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var collections;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, collecting_2.get(req.params.tag, req.query.level, req.query.time_from, req.query.time_to, function (e) {
                            res.status(500).end(e.stack);
                        })];
                    case 1:
                        collections = _a.sent();
                        if (collections.length === 0) {
                            res.status(201).end('empty');
                        }
                        else {
                            collections.forEach(function (c) {
                                c.dateISOStr = c.date.toISOString();
                            });
                            res.status(201).end(JSON.stringify({ collections: collections }));
                        }
                        return [2 /*return*/];
                }
            });
        });
    });
}
app.listen(port, function () {
    console.log("==== Service Preparing (ver:" + pkg.version + ") =====");
    console.log('==>\n');
    console.log("- Root path : " + rootPath);
    console.log("\n- Serve : \n    - path : " + servePath + " \n    - at : http://localhost:" + port + "/\n    - info : http://localhost:" + port + "/--info--");
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
    console.log("- index : " + argv.index + " \n    - at : http://localhost:" + port + "/--index--\n    ");
    console.log("- collect : " + (argv.collect ? 'on' : 'off') + "\n    - mongo : " + argv.collect + "\n    - add : http://localhost:" + port + "/--collect--/add/:tag?msg=&level=\n    - get : http://localhost:" + port + "/--collect--/get/:tag?level=\n    ");
    console.log('**** Service Running ******\n');
});
