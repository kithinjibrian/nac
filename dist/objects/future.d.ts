import { Type } from "./base";
type state = "pending" | "fulfilled" | "rejected";
export declare class FutureType extends Type<Type<any>> {
    state: state;
    constructor(value: Type<any>);
    complete(value: any): void;
}
export {};
//# sourceMappingURL=future.d.ts.map