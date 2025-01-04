"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArrayType = void 0;
const base_1 = require("./base");
class ArrayType extends base_1.Type {
    constructor(value) {
        super("array", value, {
            str: () => `[${value.map(v => v.str()).join(", ")}]`,
            getValue: () => {
                return value.map(i => {
                    return i.getValue();
                });
            },
            get: (obj) => {
                const index = obj.getValue();
                if (index >= 0 && index < value.length) {
                    return value[index];
                }
                throw new Error(`Index ${index} out of bounds`);
            },
            set: (index, newValue) => {
                const idx = index.getValue();
                if (idx < 0 || idx >= value.length) {
                    throw new Error(`Index ${idx} out of bounds`);
                }
                value[idx] = newValue; // Set the new value at the specified index
            }
        });
    }
}
exports.ArrayType = ArrayType;
