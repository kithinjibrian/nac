import { Type } from "./base";
import { NumberType } from "./number";

export function create_object(type: string, value: any) {
    if (type == "number") {
        return new NumberType(value)
    }
}