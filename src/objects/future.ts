import { Type } from "./base";

type state = "pending" | "fulfilled" | "rejected";

export class FutureType extends Type<Type<any>> {
    public state: state = "pending";
    constructor(value: Type<any>) {
        super("future", value, {
            str: () => {
                return `Future {<${this.state}>: ${value.str()}}`
            }
        });
    }

    complete(value: any) {
        console.log("setting....");
        this.value = value;
    }
}