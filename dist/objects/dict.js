"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DictType = void 0;
const base_1 = require("./base");
const bool_1 = require("./bool");
class DictType extends base_1.Type {
    constructor(value) {
        super("object", value, {
            getValue: () => {
                return Object.entries(value).reduce((acc, [key, val]) => {
                    acc[key] = val.getValue();
                    return acc;
                }, {});
            },
            str: (indentLevel = 0) => {
                let result = "{\n";
                const indent = "  ".repeat(indentLevel + 1);
                Object.entries(value).forEach(([key, val], index, array) => {
                    result += `${indent}${key}: `;
                    if (val && typeof val === "object" && val.str) {
                        result += val.str(indentLevel + 1);
                    }
                    else {
                        result += val.str ? val.str() : String(val.getValue());
                    }
                    if (index < array.length - 1) {
                        result += ",\n";
                    }
                });
                result += "\n" + "  ".repeat(indentLevel) + "}";
                return result;
            },
            get: (obj) => {
                const index = obj.getValue();
                if (value[index])
                    return value[index];
                else
                    return new bool_1.BoolType(false);
            },
            set: (key, newValue) => {
                const index = key.getValue();
                value[index] = newValue;
            }
        });
    }
}
exports.DictType = DictType;
