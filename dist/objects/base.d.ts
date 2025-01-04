export interface Operations<T> {
    getType?: () => string;
    getValue?: () => any;
    inc?: () => Type<T>;
    dec?: () => Type<T>;
    add?: (obj: Type<T>) => Type<T>;
    minus?: (obj: Type<T>) => Type<T>;
    divide?: (obj: Type<T>) => Type<T>;
    modulo?: (obj: Type<T>) => Type<T>;
    multiply?: (obj: Type<T>) => Type<T>;
    str?: (indentLevel?: number) => string;
    lt?: (obj: Type<T>) => Type<boolean>;
    gt?: (obj: Type<T>) => Type<boolean>;
    eq?: (obj: Type<T>) => Type<boolean>;
    neq?: (obj: Type<T>) => Type<boolean>;
    get?: (obj: Type<any>) => Type<any> | undefined;
    set?: (index: Type<any>, new_value: Type<any>) => void;
}
export declare abstract class Type<T> {
    type: string;
    protected readonly value: T;
    protected readonly operations: Operations<T>;
    constructor(type: string, value: T, operations: Operations<T>);
    getType(): string;
    getValue(): T;
    str(indentLevel?: number): string;
    get(obj: Type<any>): Type<T> | undefined;
    set(index: Type<any>, new_value: Type<any>): void;
    add(obj: Type<T>): Type<T>;
    minus(obj: Type<T>): Type<T>;
    multiply(obj: Type<T>): Type<T>;
    divide(obj: Type<T>): Type<T>;
    modulo(obj: Type<T>): Type<T>;
    lt(obj: Type<T>): Type<boolean>;
    gt(obj: Type<T>): Type<boolean>;
    eq(obj: Type<T>): Type<boolean>;
    neq(obj: Type<T>): Type<boolean>;
    inc(): Type<T>;
    dec(): Type<T>;
}
//# sourceMappingURL=base.d.ts.map