import { Type } from "./base";

export class NullType extends Type<null> {
    constructor(value: null = null) {
        super("null", value, {});
    }
}