import { TypeClass, Types } from "./type";
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
export declare class HM {
    constraints: Constraint[];
    opts: Record<string, any>;
    constructor(constraints?: Constraint[]);
    typeToString(type: Types): String;
    constraint_eq(left: Types, right: Types): void;
    bind(a: Types, b: Types): Map<string, Types> | null;
    apply(subst: Map<string, Types>, type: Types): Types | null;
    compose(a: Map<string, Types>, b: Map<string, Types>): Map<string, Types | null>;
    private getTypeClassConstraints;
    private checkTypeClassConstraint;
    unify(a: Types | null, b: Types | null): Map<string, Types> | null;
    solve(): Map<any, any>;
}
//# sourceMappingURL=hm.d.ts.map