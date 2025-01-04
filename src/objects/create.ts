import { ArrayType } from "./array";
import { Type } from "./base";
import { BoolType } from "./bool";
import { DictType } from "./dict";
import { NullType } from "./null";
import { NumberType } from "./number";
import { StringType } from "./string";

export function create_object(value: any): Type<any> {
    if (value === null) {
        throw new Error("Null values are not supported");
    }

    if (typeof value == "number") {
        return new NumberType(value);
    } else if (typeof value == "string") {
        return new StringType(value);
    } else if (typeof value == "boolean") {
        return new BoolType(value);
    } else if (typeof value == "object") {
        if (Array.isArray(value)) {
            return new ArrayType(value.map(v => create_object(v)))
        } else {
            return new DictType(Object.entries(value).reduce((acc, [key, val]) => {
                acc[key] = create_object(val);
                return acc;
            }, {} as Record<string, Type<any>>));
        }
    }

    throw new Error(`Unsupported data type: ${typeof value}`);
}