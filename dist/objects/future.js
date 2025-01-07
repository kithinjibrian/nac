"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FutureType = void 0;
const base_1 = require("./base");
class FutureType extends base_1.Type {
    constructor(value) {
        super("future", value, {
            str: () => {
                return `Future {<${this.state}>: ${value.str()}}`;
            }
        });
        this.state = "pending";
    }
    complete(value) {
        console.log("setting....");
        this.value = value;
    }
}
exports.FutureType = FutureType;
