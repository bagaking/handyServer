"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var walk_1 = __importDefault(require("walk"));
var path_1 = __importDefault(require("path"));
function indexingPath(indexMode, targetPath) {
    var files = [];
    return new Promise(function (resolve, reject) {
        try {
            var walker = walk_1.default.walk(targetPath, { followLinks: false });
            walker.on('file', function (root, stat, next) {
                var route = root.replace(targetPath, "");
                var file = stat;
                if (indexMode === "name") {
                    files.push(indexMode === "name" ? path_1.default.join(route, file.name) : { route: route, file: file });
                }
                next();
            });
            walker.on("errors", function (root, nodeStatsArray, next) {
                next();
            });
            walker.on('end', function () {
                resolve(files);
            });
        }
        catch (e) {
            reject(e);
        }
    });
}
exports.indexingPath = indexingPath;
