"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = __importDefault(require("mongoose"));
var LogSchema = new mongoose_1.default.Schema({
    level: String,
    mod: String,
    date: {
        type: Date,
        default: Date.now
    },
    msg: {
        type: String,
        default: '--empty--'
    }
});
function getLogSchema(conn) {
    if (conn === void 0) { conn = 'mongodb://localhost/logs'; }
    return mongoose_1.default.model('log', LogSchema);
}
exports.default = getLogSchema;
