import { TypeClass, Types } from "./type";
declare global {
    interface Set<T> {
        addType(value: Types): Set<Types>;
        hasType(value: Types): boolean;
    }
    interface Map<K, V> {
        getType(key: Types): Types;
        setType(key: Types, value: Types): Map<Types, Types>;
    }
}
type Scheme = {
    vars: Set<Types>;
    type: Types;
};
export type Constraint = {
    tag: "EQUALITY_CON";
    left: Types;
    right: Types;
} | {
    tag: "EXPLICIT_CON";
    instance_type: Types;
    scheme: Record<string, any>;
} | {
    tag: "IMPLICIT_CON";
    antecedent: Types;
    consequent: Types;
    M: Set<any>;
} | {
    tag: "TYPECLASS_CON";
    type: Types;
    type_class: TypeClass;
};
export declare function tcon(type: string): Types;
export declare function tfun(params: Types[], ret: Types): Types;
export declare function tcon_ex(name: string, types: Types[]): Types;
export declare function tvar(name?: string): Types;
export declare class HM {
    constraints: Constraint[];
    opts: Record<string, any>;
    constructor(constraints?: Constraint[]);
    typeToString(type: Types): String;
    generalize(ctx: any, type: Types): Scheme;
    instantiate(scheme: Scheme): Types | null;
    constraint_eq(left: Types, right: Types): void;
    bind(a: Types, b: Types): Map<Types, Types> | null;
    apply(subst: Map<Types, Types>, type: Types): Types | null;
    tvs(type: Types): Set<Types>;
    compose(a: Map<Types, Types>, b: Map<Types, Types>): Map<Types, Types | null>;
    private getTypeClassConstraints;
    private checkTypeClassConstraint;
    unify(a: Types | null, b: Types | null): Map<Types, Types> | null;
    solve(): Map<any, any>;
}
export {};
//# sourceMappingURL=hm.d.ts.map