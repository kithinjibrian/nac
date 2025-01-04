import { TypeClass, Types } from "./type";

export type Constraint =
    | {
        tag: "EQUALITY_CON";
        left: Types;
        right: Types;
    }
    | {
        tag: "EXPLICIT_CON";
        instance_type: Types;
        scheme: Record<string, any>
    }
    | {
        tag: "IMPLICIT_CON";
        antecedent: Types;
        consequent: Types;
        M: Set<any>
    }
    | {
        tag: "TYPECLASS_CON",
        type: Types;
        type_class: TypeClass
    }

export class HM {
    public opts: Record<string, any> = {
        unifyTVars: false
    };

    constructor(
        public constraints: Constraint[] = []
    ) { }

    typeToString(type: Types): String {
        switch (type.tag) {
            case "TVar": {
                return type.tvar;
            }
            case "TCon": {
                const name = type.tcon.name;
                if (name == "->") {
                    const types = type.tcon.types;
                    if (types.length === 0) {
                        return "() -> ()";
                    }

                    const ret = types.pop();
                    return `(${types.map(i => this.typeToString(i)).join(", ")}) -> ${ret && this.typeToString(ret)}`;
                }

                return name;
            }
            default:
                throw new Error(`Unsupported type tag: ${type.tag}`);
        }
    }

    constraint_eq(left: Types, right: Types) {
        this.constraints.push({
            tag: "EQUALITY_CON",
            left,
            right
        });
    }

    bind(a: Types, b: Types): Map<string, Types> | null {
        const subst = new Map();

        if (a.tag === "TVar") {
            subst.set(a.tvar, b);
        }
        return subst;
    };

    apply(subst: Map<string, Types>, type: Types): Types | null {
        if (type.tag === "TVar") {
            return subst.get(type.tvar) ?? type;
        } else if (type.tag === "TCon") {
            return {
                tag: "TCon",
                tcon: {
                    name: type.tcon.name,
                    types: type.tcon.types.map((t) => this.apply(subst, t)).filter(i => i !== null),
                    constraints: [...type.tcon.constraints]
                }
            }
        } else if (type.tag === "TRec") {
            return {
                tag: "TRec",
                trec: {
                    name: type.trec.name,
                    types: Object.entries(type.trec.types)
                        .reduce((acc, [key, val]) => {
                            const substituted = this.apply(subst, val);
                            if (substituted) {
                                acc[key] = substituted;
                            }
                            return acc;
                        }, {} as Record<string, Types>
                        ),
                    constraints: [...type.trec.constraints]
                }
            }
        }

        return null;
    };

    compose(a: Map<string, Types>, b: Map<string, Types>) {
        const union = new Map([...a, ...b]);
        return new Map(
            Array.from(union).map(([key, value]) => [
                key,
                this.apply(a, value),
            ])
        );
    };

    private getTypeClassConstraints(type: Types): TypeClass[] | undefined {
        switch (type.tag) {
            case "TVar":
                return type.constraints;
            case "TCon":
                return type.tcon.constraints;
            case "TRec":
                return type.trec.constraints;
            default:
                return undefined;
        }
    }

    private checkTypeClassConstraint(type: Types, constraint: TypeClass[]): boolean {
        const typeConstraints = this.getTypeClassConstraints(type);
        if (!typeConstraints) return false;

        return constraint.some(requiredConstraint =>
            typeConstraints.some(typeConstraint =>
                typeConstraint.name === requiredConstraint.name
            )
        );
    }

    unify(a: Types | null, b: Types | null): Map<string, Types> | null {
        if (a == null || b == null || a === b) return new Map();

        if (a.tag === "TVar" && b.tag === "TVar") {
            if (!this.opts.unifyTVars) {
                throw new Error(`Can't unify two type variables!`);
            }

            const mergedConstraints = [...new Set([...a.constraints, ...b.constraints])];
            a.constraints = mergedConstraints;
            b.constraints = mergedConstraints;
        }


        if (a.tag === "TVar") {
            if (a.constraints.length > 0 &&
                !this.checkTypeClassConstraint(b, a.constraints)
            ) {
                throw new Error(`Type '${this.typeToString(b)}' does not satisfy constraint ${a.constraints.map(i => `'${i.name}'`).join(", ")}`);
            }

            return this.bind(a, b);
        }

        if (b.tag === "TVar") {
            if (b.constraints.length > 0 &&
                !this.checkTypeClassConstraint(a, b.constraints)
            ) {
                throw new Error(`Type '${this.typeToString(a)}' does not satisfy constraint ${b.constraints.map(i => `'${i.name}'`).join(", ")}`);
            }

            return this.bind(b, a);
        }

        if (a.tag === "TCon" && b.tag === "TCon") {
            if (a.tcon.name !== b.tcon.name) throw new Error(`Types mismatch: Can't unify '${a.tcon.name}' with '${b.tcon.name}'`);

            let subst = new Map();
            for (let i = 0; i < a.tcon.types.length; i++) {

                const newSubst = this.unify(
                    this.apply(subst, a.tcon.types[i]),
                    this.apply(subst, b.tcon.types[i])
                );
                if (newSubst) subst = this.compose(subst, newSubst);
            }
            return subst;
        }

        if (a.tag === "TCon" && b.tag === "TRec") {
            if (a.tcon.name !== "map") throw new Error(`Types mismatch: Can't unify '${a.tcon.name}' with '${b.trec.name}'`);

            let subst = new Map();
            const bt = a.tcon.types[0];

            Object.entries(b.trec.types).map(([key, value]) => {
                const newSubst = this.unify(
                    this.apply(subst, bt),
                    this.apply(subst, value)
                );

                if (newSubst) subst = this.compose(subst, newSubst);
            })

            return subst;
        }

        if (a.tag === "TRec" && b.tag === "TRec") {
            if (a.trec.name !== b.trec.name) {
                if (b.trec.name !== "map")
                    throw new Error(`Types mismatch: Can't unify '${a.trec.name}' with '${b.trec.name}'`);
            }

            let subst = new Map();

            Object.entries(b.trec.types)
                .map(([key, b_type]) => {
                    const a_type = a.trec.types[key];

                    if (!a_type) {
                        throw new Error(`Missing field '${key}' in type '${a.trec.name}'`);
                    }

                    const newSubst = this.unify(
                        this.apply(subst, a_type),
                        this.apply(subst, b_type)
                    );

                    if (newSubst) subst = this.compose(subst, newSubst);
                })
        }

        return null;
    };

    solve() {
        let subst = new Map();
        const errors: string[] = [];

        this.constraints.forEach((constraint) => {
            try {
                let new_subst;

                if (constraint.tag == "EQUALITY_CON") {
                    new_subst = this.unify(
                        this.apply(subst, constraint.left),
                        this.apply(subst, constraint.right)
                    );
                }

                if (new_subst && new_subst.size != 0) {
                    subst = this.compose(subst, new_subst)
                }

            } catch (e: any) {
                errors.push(e.message);
            }
        })

        if (errors.length > 0) {
            throw new Error(`Types errors found:\n${errors.join('\n')}`);
        }

        return subst;
    }

}