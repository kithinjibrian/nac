"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoolType = void 0;
const base_1 = require("./base");
class BoolType extends base_1.Type {
    constructor(value) {
        super("bool", value, {});
    }
}
exports.BoolType = BoolType;
