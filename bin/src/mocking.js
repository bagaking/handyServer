"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var mockFiles = new Map();
function mockingPath(path, routeParent) {
    // console.log("[mockFile] load", path);
    if (routeParent === void 0) { routeParent = '-'; }
    var fstat = fs_1.default.lstatSync(path);
    var filename = path_1.default.parse(path).name;
    var route = routeParent !== '-' ? path_1.default.join(routeParent, filename) : '';
    if (fstat.isDirectory()) {
        // console.log("dir", route, path);
        var files = fs_1.default.readdirSync(path).filter(function (file) { return !file.match(/\..*\.swp/); });
        files.forEach(function (file) { return mockingPath(path_1.default.join(path, file), route); });
    }
    else if (fstat.isFile()) {
        var route_1 = path_1.default.join(routeParent, filename);
        console.log("file", route_1, path);
        mockFiles.set(route_1, path);
    }
    return mockFiles;
}
exports.mockingPath = mockingPath;
