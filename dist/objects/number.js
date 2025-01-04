"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumberType = void 0;
const base_1 = require("./base");
const bool_1 = require("./bool");
class NumberType extends base_1.Type {
    constructor(value) {
        super("number", value, {
            add: (obj) => new NumberType(value + obj.getValue()),
            minus: (obj) => new NumberType(value - obj.getValue()),
            multiply: (obj) => new NumberType(value * obj.getValue()),
            divide: (obj) => {
                const divisor = obj.getValue();
                if (divisor === 0)
                    throw new Error("Cannot divide by zero");
                return new NumberType(value / divisor);
            },
            inc: () => new NumberType(value++),
            dec: () => new NumberType(value--),
            modulo: (obj) => new NumberType(value % obj.getValue()),
            lt: (obj) => new bool_1.BoolType(value < obj.getValue()),
            gt: (obj) => new bool_1.BoolType(value > obj.getValue()),
            eq: (obj) => new bool_1.BoolType(value === obj.getValue()),
            neq: (obj) => new bool_1.BoolType(value !== obj.getValue()),
        });
    }
}
exports.NumberType = NumberType;
