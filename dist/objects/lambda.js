"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaType = void 0;
const base_1 = require("./base");
class LambdaType extends base_1.Type {
    constructor(value) {
        super("function", value, {
            str() {
                return `[Function: Anonymous]`;
            }
        });
    }
}
exports.LambdaType = LambdaType;
