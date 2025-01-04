"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionType = void 0;
const base_1 = require("./base");
class FunctionType extends base_1.Type {
    constructor(value) {
        super("function", value, {
            str() {
                return `[Function: ${value.identifier}]`;
            }
        });
    }
}
exports.FunctionType = FunctionType;
