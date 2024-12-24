import { Type } from "./base";

export class ArrayType extends Type<Type<any>[]> {
    constructor(value: Type<any>[]) {
        super("array", value, {
            str: () => `[${value.map(v => v.str()).join(", ")}]`,
            get: (obj: Type<number>) => {
                const index = obj.getValue();
                if (index >= 0 && index < value.length) {
                    return value[index];
                }
                throw new Error(`Index ${index} out of bounds`);
            },
            set: (index: Type<number>, newValue: Type<any>) => {
                const idx = index.getValue();
                if (idx < 0 || idx >= value.length) {
                    throw new Error(`Index ${idx} out of bounds`);
                }
                value[idx] = newValue;  // Set the new value at the specified index
            }
        });
    }
}