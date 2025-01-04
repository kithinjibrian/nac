"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringType = void 0;
const base_1 = require("./base");
class StringType extends base_1.Type {
    constructor(value) {
        super("string", value, {
            add: (obj) => new StringType(value + obj.getValue()),
            str: () => `"${value}"`,
            get: (obj) => {
                const index = obj.getValue();
                if (index >= 0 && index < value.length) {
                    return new StringType(value[index]); // Return a new StringType for the character
                }
                throw new Error(`Index ${index} out of bounds for string "${value}"`);
            }
        });
    }
}
exports.StringType = StringType;
