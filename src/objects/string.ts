import { Type } from "./base";

export class StringType extends Type<string> {
    constructor(value: string) {
        super("string", value, {
            add: (obj: Type<string>) => new StringType(value + obj.getValue()),
            str: () => `"${value}"`,
            get: (obj: Type<number>) => {
                const index = obj.getValue();
                if (index >= 0 && index < value.length) {
                    return new StringType(value[index]); // Return a new StringType for the character
                }
                throw new Error(`Index ${index} out of bounds for string "${value}"`);
            }
        });
    }
}