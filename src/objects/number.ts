import { Type } from "./base";
import { BoolType } from "./bool";

export class NumberType extends Type<number> {
    constructor(value: number) {
        super("number", value, {
            add: (obj: Type<number>) => new NumberType(value + obj.getValue()),
            minus: (obj: Type<number>) => new NumberType(value - obj.getValue()),
            multiply: (obj: Type<number>) => new NumberType(value * obj.getValue()),
            divide: (obj: Type<number>) => {
                const divisor = obj.getValue();
                if (divisor === 0) throw new Error("Cannot divide by zero");
                return new NumberType(value / divisor);
            },
            inc: () => new NumberType(value++),
            dec: () => new NumberType(value--),
            modulo: (obj: Type<number>) => new NumberType(value % obj.getValue()),
            lt: (obj: Type<number>) => new BoolType(value < obj.getValue()),
            gt: (obj: Type<number>) => new BoolType(value > obj.getValue()),
            eq: (obj: Type<number>) => new BoolType(value === obj.getValue()),
            neq: (obj: Type<number>) => new BoolType(value !== obj.getValue()),
        });
    }
}