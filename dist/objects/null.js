"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NullType = void 0;
const base_1 = require("./base");
class NullType extends base_1.Type {
    constructor(value = null) {
        super("null", value, {});
    }
}
exports.NullType = NullType;
