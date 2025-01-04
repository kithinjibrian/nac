import { ArrayNode, ASTNode, ASTVisitor, BinaryOpNode, BlockNode, CallExpressionNode, ExpressionStatementNode, FieldNode, FunctionDecNode, GenericTypeNode, IdentifierNode, IfElseNode, MemberExpressionNode, NumberNode, ObjectNode, ParameterNode, ParametersListNode, ReturnNode, SourceElementsNode, StringNode, StructDefNode, StructNode, TypeNode, TypeParameterNode, VariableListNode, VariableNode } from "../parser/ast";
import { Lexer } from "../lexer/lexer";
import { Parser } from "../parser/parser";
import { Builtin } from "../phases/phases";
import { Frame, lookup_symbol, new_frame, set_symbol } from "../dsa/symtab"
import { HM } from "./hm";

export interface TypeClass {
    name: string;
    methods: string[];
}

export type Types =
    | {
        tag: "TVar";
        tvar: string;
        constraints: TypeClass[];
    }
    | {
        tag: "TCon";
        tcon: {
            name: string;
            types: Types[];
            constraints: TypeClass[];
        };
    }
    | {
        tag: "TRec";
        trec: {
            name: string;
            types: Record<string, Types>;
            constraints: TypeClass[];
        }
    };

export const numericTypeClass: TypeClass = {
    name: "Num",
    methods: ["+", "-", "*", "/"]
};

export const stringTypeClass: TypeClass = {
    name: "Stringable",
    methods: ["+"]
};

export const ordTypeClass: TypeClass = {
    name: "Ord",
    methods: ["<", ">", "<=", ">="]
};

export const eqTypeClass: TypeClass = {
    name: "Eq",
    methods: ["==", "!="]
};

export const showTypeClass: TypeClass = {
    name: "Show",
    methods: ["str"]
}

function tcon(type: string): Types {
    return {
        tag: "TCon",
        tcon: {
            name: type,
            types: [],
            constraints: []
        }
    };
}

function tfun(params: Types[], ret: Types): Types {
    return {
        tag: "TCon",
        tcon: {
            name: "->",
            types: [...params, ret],
            constraints: []
        }
    }
}

function tcon_ex(name: string, types: Types[]): Types {
    return {
        tag: "TCon",
        tcon: {
            name: name,
            types: types,
            constraints: []
        }
    }
}

let counter = 0;

function tvar(
    name?: string
): Types {
    return {
        tag: "TVar",
        tvar: name ?? `T${counter++}`,
        constraints: []
    };
}

export class TypeChecker implements ASTVisitor {
    public hm: HM = new HM();
    public global: Frame = new_frame(null);
    public subst: Map<any, any> = new Map();

    constructor(
        public opts: Record<string, any> = {},
        public primitives: string[] = ["integer", "float", "boolean", "string"]
    ) {
        Object.assign(this.hm.opts, opts);
    }

    public run(
        ast: ASTNode,
        builtin: Record<string, Builtin>
    ) {
        this.enter({ frame: this.global });

        Object.entries(builtin)
            .map(([key, value]) => {
                if (value.type == "function") {
                    this.global.symbol_table.set(key, this.proc_builtin({ node: value }));
                } else if (value.type == "variable") {
                    this.global.symbol_table.set(key, this.proc_builtin({ node: value }));
                }
            })

        const ret = ast.accept(this, { frame: this.global });

        this.exit();

        return ret;
    }

    public proc_builtin({ node }: { node: Builtin }) {
        if (node.type == "function") {
            const lexer = new Lexer(node.signature);
            const tokens = lexer.tokenize();
            const parser = new Parser(tokens);
            const ast = parser.type();

            const tc = new TypeChecker();
            const ty = tc.run(ast, {});

            if (ty !== undefined) {
                return ty;
            }
        }

        return tcon("void");
    }

    public enter({ frame }: { frame: Frame }) {
        set_symbol("tc:Num", numericTypeClass, frame);
        set_symbol("tc:Stringable", stringTypeClass, frame);
        set_symbol("tc:Ord", ordTypeClass, frame);
        set_symbol("tc:Eq", eqTypeClass, frame);
        set_symbol("tc:Show", showTypeClass, frame);

        set_symbol("tcon:integer", [showTypeClass, numericTypeClass, ordTypeClass, eqTypeClass], frame)
        set_symbol("tcon:float", [showTypeClass, numericTypeClass, ordTypeClass, eqTypeClass], frame)
        set_symbol("tcon:string", [showTypeClass, stringTypeClass, eqTypeClass], frame)
    }

    public addTypeClassConstraint(type: Types, typeClass: TypeClass) {
        switch (type.tag) {
            case "TVar":
                if (!type.constraints.some(tc => tc.name === typeClass.name)) {
                    type.constraints.push(typeClass);
                }
                break;
            case "TCon":
                if (!type.tcon.constraints.some(tc => tc.name === typeClass.name)) {
                    type.tcon.constraints.push(typeClass);
                }
                break;
            case "TRec":
                if (!type.trec.constraints.some(tc => tc.name === typeClass.name)) {
                    type.trec.constraints.push(typeClass);
                }
                break;
        }
    }

    public checkTypeClassConstraints(
        type: Types,
        requiredClass: TypeClass,
        frame: Frame
    ): boolean {
        const constraints = type.tag === "TVar" ? type.constraints :
            type.tag === "TCon" ? type.tcon.constraints :
                type.tag === "TRec" ? type.trec.constraints : [];


        if (constraints.some(tc => tc.name === requiredClass.name)) {
            return true;
        }

        if (type.tag === "TCon") {
            const instances: TypeClass[] = lookup_symbol(`tcon:${type.tcon.name}`, frame);
            if (instances && instances.some(tc => tc.name === requiredClass.name)) {
                this.addTypeClassConstraint(type, requiredClass);
                return true;
            }
        }

        if (type.tag === "TVar") {
            this.addTypeClassConstraint(type, requiredClass);
            return true;
        }

        return false;
    }

    private typeToString(type: Types): string {
        return type.tag === "TCon" ? type.tcon.name : type.tag === "TRec" ? type.trec.name : type.tvar;
    }

    before_accept(node: ASTNode) {
        //console.log(node.type);
    }

    visitSourceElements(
        node: SourceElementsNode,
        args?: Record<string, any>
    ): Types[] {
        const result: Types[] = [];
        for (const n of node.sources) {
            const r = n.accept(this, args);
            if (r !== undefined) result.push(r);
        }

        return result;
    }

    visitExpressionStatement(
        node: ExpressionStatementNode,
        args?: Record<string, any>
    ) {
        return node.expression.accept(this, args);
    }

    visitFunctionDec(
        node: FunctionDecNode,
        { frame }: { frame: Frame }
    ): Types {
        const nf = new_frame(frame);

        if (node.type_parameters) {
            node.type_parameters.forEach(tp => {
                tp.accept(this, { frame });
            })
        }

        let types: Types[] = [];
        if (node.params) {
            const ts = node.params.accept(this, { frame: nf });
            if (ts !== undefined)
                types = ts;
        }


        const body = node.body.accept(this, { frame: nf });
        const returnType = tvar();


        if (body !== undefined) {
            for (const retType of (body as Types[])) {
                this.hm.constraint_eq(returnType, retType);
            }
        }

        const ftype = tfun(types, returnType);

        set_symbol(node.identifier, ftype, frame);

        return ftype;
    }

    visitParametersList(
        node: ParametersListNode,
        args?: Record<string, any>
    ): Types[] {
        const params: Types[] = [];
        for (const n of node.parameters) {
            const t = n.accept(this, args);
            if (t !== undefined)
                params.push(t);
        }

        return params;
    }

    visitParameter(
        node: ParameterNode,
        { frame }: { frame: Frame }
    ): Types {
        if (node.identifier.data_type) {
            const t = node.identifier.data_type.accept(this, { frame });
            if (t !== undefined) {
                set_symbol(node.identifier.name, t, frame);
                return t;
            }
        }

        const paramType = node.variadic ? tcon_ex("array", [tvar()]) : tvar();

        set_symbol(node.identifier.name, paramType, frame);

        return paramType;
    }

    visitBlock(
        node: BlockNode,
        { frame }: { frame: Frame }
    ): Types[] {
        const nf = new_frame(frame);

        let lastType: Types | void = undefined;
        let returnTypes: Types[] = [];

        for (const n of node.body) {
            const stmtType = n.accept(this, { frame: nf });

            if (stmtType !== undefined) {
                lastType = stmtType;
            }

            if (nf.return_flag) {
                returnTypes.push(nf.return_value);
            }
        }

        if (returnTypes.length === 0 && lastType) {
            returnTypes.push(lastType);
        }

        return returnTypes;
    }

    visitReturn(
        node: ReturnNode,
        { frame }: { frame: Frame }
    ): Types {
        frame.return_flag = true;

        if (node.expression) {
            const exprType = node.expression.accept(this, { frame });
            if (exprType !== undefined) {
                frame.return_value = exprType;
                return exprType;
            }
        }

        frame.return_value = tcon("void");
        return tcon("void");
    }

    visitIfElse(
        node: IfElseNode,
        args?: Record<string, any>
    ): Types | void {
        const cond = node.condition.accept(this, args);

        if (cond !== undefined)
            this.hm.constraint_eq(cond, tcon("boolean"))

        const ctype = node.consequent.accept(this, args);
        node.alternate?.accept(this);

        return ctype;
    }

    visitVariableList(
        node: VariableListNode,
        args?: Record<string, any>
    ): Types | void {
        for (const n of node.variables) {
            const result = n.accept(this, args);
            if (result !== undefined) return result;
        }
    }

    visitVariable(
        node: VariableNode,
        { frame }: { frame: Frame }
    ): Types | void {
        const existing = lookup_symbol(node.identifier.name, frame);
        if (existing) return existing;

        let def_type: Types | void = undefined;
        if (node.identifier.data_type) {
            def_type = node.identifier.data_type.accept(this, { frame });
        }

        if (node.expression) {
            const inferredType = node.expression.accept(this, { frame });


            if (inferredType !== undefined) {
                node.data_type = inferredType;
                set_symbol(node.identifier.name, inferredType, frame)
            };

            if (def_type !== undefined && inferredType !== undefined) {
                this.hm.constraint_eq(def_type, inferredType);
                let dt = def_type as Types;
                if (dt.tag == "TRec") {
                    if (dt.trec.name !== "map") {
                        return dt;
                    }
                }
            }

            return inferredType;
        }
    }

    visitAssignmentExpression(
        node: BinaryOpNode,
        { frame }: { frame: Frame }
    ) {
        const left = node.left.accept(this, { frame });
        const right = node.right.accept(this, { frame });

        if (left == undefined || right == undefined) {
            throw new Error("Invalid operands");
        }

        this.hm.constraint_eq(left, right);

        if (node.left instanceof IdentifierNode) {
            set_symbol(node.left.name, left, frame);
        }
    }

    visitBinaryOp(
        node: BinaryOpNode,
        { frame }: { frame: Frame }
    ): Types {
        const left = node.left.accept(this, { frame });
        const right = node.right.accept(this, { frame });

        if (left == undefined || right == undefined) {
            throw new Error("Invalid operands");
        }

        switch (node.operator) {
            case "+": {
                const numClass = lookup_symbol("tc:Num", frame) as TypeClass;
                const stringClass = lookup_symbol("tc:Stringable", frame) as TypeClass;

                if (this.checkTypeClassConstraints(left, stringClass, frame) &&
                    this.checkTypeClassConstraints(right, stringClass, frame)) {
                    this.hm.constraint_eq(left, right);
                    return left;
                }

                if (this.checkTypeClassConstraints(left, numClass, frame) &&
                    this.checkTypeClassConstraints(right, numClass, frame)) {
                    this.hm.constraint_eq(left, right);
                    return left;
                }

                throw new Error(
                    `Operator '+' requires either Num or Stringable type class for types ${this.typeToString(left)} and ${this.typeToString(right)}`
                );
            }

            case "-":
            case "*":
            case "/": {
                const numClass = lookup_symbol("tc:Num", frame) as TypeClass;

                if (!this.checkTypeClassConstraints(left, numClass, frame) ||
                    !this.checkTypeClassConstraints(right, numClass, frame)) {
                    throw new Error(
                        `Operator '${node.operator}' requires Num type class for types ${this.typeToString(left)} and ${this.typeToString(right)}`
                    );
                }

                this.hm.constraint_eq(left, right);

                return left;
            }

            case "<":
            case ">":
            case "<=":
            case ">=": {
                const ordClass = lookup_symbol("tc:Ord", frame) as TypeClass;
                if (!this.checkTypeClassConstraints(left, ordClass, frame) ||
                    !this.checkTypeClassConstraints(right, ordClass, frame)) {
                    throw new Error(
                        `Comparison requires Ord type class for types ${this.typeToString(left)} and ${this.typeToString(right)}`
                    );
                }
                this.hm.constraint_eq(left, right);
                return tcon("boolean");
            }

            case "==":
            case "!=": {
                const eqClass = lookup_symbol("tc:Eq", frame) as TypeClass;
                if (!this.checkTypeClassConstraints(left, eqClass, frame) ||
                    !this.checkTypeClassConstraints(right, eqClass, frame)) {
                    throw new Error(
                        `Equality comparison requires Eq type class for types ${this.typeToString(left)} and ${this.typeToString(right)}`
                    );
                }
                this.hm.constraint_eq(left, right);
                return tcon("boolean");
            }
        }

        throw new Error(`Unsupported operator: ${node.operator}`);
    }

    visitCallExpression(node: CallExpressionNode, args?: Record<string, any>) {
        const callee = node.callee.accept(this, args);

        const _args: Types[] = [];

        node.args.forEach((a) => {
            const y = a.accept(this, args);
            if (y !== undefined)
                _args.push(y);
        });


        const ret = tvar();
        const ftype = tfun(_args, ret);

        if (callee !== undefined)
            this.hm.constraint_eq(callee, ftype);

        return ret;
    }

    visitMemberExpression(
        node: MemberExpressionNode,
        args?: Record<string, any>
    ) {
        const t = node.object.accept(this, args);

        if (t != undefined) {
            const tp = t as Types;
            if (tp.tag == "TCon") {
                if (tp.tcon.name == "array") {
                    return tp.tcon.types[0];
                }
            } else if (tp.tag == "TRec") {
                const key = (node.property as IdentifierNode).name;
                return tp.trec.types[key];
            }
        }
    }

    visitIdentifier(
        node: IdentifierNode,
        { frame }: { frame: Frame }
    ) {
        const type = lookup_symbol(node.name, frame);

        if (type) return type;

        return tvar();
    }

    visitGenericType(
        node: GenericTypeNode,
        { frame }: { frame: Frame }
    ): Types | void {

        node.type_parameters.forEach(tp => {
            tp.accept(this, { frame })
        });

        return node.base_type.accept(this, { frame })
    }

    visitTypeParameter(
        node: TypeParameterNode,
        { frame }: { frame: Frame }
    ) {
        const tv: Types = tvar(node.name);

        if (node.constraints) {
            node.constraints.forEach(str => {
                const tc = lookup_symbol(`tc:${str}`, frame)
                if (tv.tag == "TVar")
                    tv.constraints.push(tc);
            })
        }

        set_symbol(`T:${node.name}`, tv, frame);

        return tv;
    }

    visitType(
        node: TypeNode,
        { frame }: { frame: Frame }
    ): Types | void {
        if (node.name == "->") {
            let params, retType;
            if (node.types) {
                params = node.types[0].accept(this, { frame });
                retType = node.types[1].accept(this, { frame });
                return tfun(params, retType);
            }
        } else if (node.name == "array") {
            if (node.types) {
                const elem = node.types[0].accept(this, { frame });
                return tcon_ex("array", [elem]);
            }
        } else if (node.name == "map") {
            if (node.types) {
                const val = node.types[1].accept(this, { frame });
                return tcon_ex("map", [val]);
            }
        } else if (node.name == "struct") {
            if (node.types) {
                const name = node.types[0];
                const struct_node: StructNode = lookup_symbol(name, frame);

                if (!struct_node) return tvar(); // careful here

                const it: Types[] = []
                for (let i = 1; i < node.types.length; i++) {
                    const ct = (node.types[i] as ASTNode).accept(this, { frame });
                    if (ct !== undefined)
                        it.push(ct);
                }

                if (struct_node.type_parameters) {
                    for (let y = 0; y < struct_node.type_parameters.length; y++) {
                        const ct = struct_node.type_parameters[y].accept(this, { frame });
                        if (it[y] && ct !== undefined) {
                            this.hm.constraint_eq(it[y], ct);
                        }
                    }
                }

                const types: Record<string, Types> = {};

                struct_node.body.forEach(f => {
                    const b = f.accept(this, { frame })
                    if (b !== undefined) {
                        const a = b as { magic: string, name: string, type: Types };
                        if (a.magic && a.magic == "field") {
                            types[a.name] = a.type;
                        }
                    }
                })



                return {
                    tag: "TRec",
                    trec: {
                        name,
                        types,
                        constraints: []
                    }
                } as Types;
            }
        }
        else if (this.primitives.includes(node.name)) {
            const tc = lookup_symbol(`tcon:${node.name}`, frame);
            const p = tcon(node.name);
            if (p.tag == "TCon")
                p.tcon.constraints = [...tc];

            return p;
        } else {
            const tvar = lookup_symbol(`T:${node.name}`, frame);
            if (tvar) {
                return tvar;
            }
            throw new Error(`Couldn't find generic type <${node.name}>`);
        }
    }

    visitArray(node: ArrayNode, args?: Record<string, any>): Types {
        const types: Types[] = [];
        node.elements.forEach((a, index) => {
            const t = a.accept(this, args);
            if (t !== undefined) {
                types.push(t);

                if (index > 0) {
                    this.hm.constraint_eq(types[0], t);
                }
            }
        })

        if (types.length == 0) {
            return tcon_ex("array", [tcon("unknown")]);
        }

        return tcon_ex("array", [types[0]])
    }

    visitObject(node: ObjectNode, args?: Record<string, any>) {
        const types: Record<string, Types> = {};
        node.properties.forEach((a, index) => {
            const key = a.key;
            const val = a.value.accept(this, args);

            if (val !== undefined)
                types[key] = val;
        })

        return {
            tag: "TRec",
            trec: {
                name: "map",
                types,
                constraints: []
            }
        } as Types;
    }

    visitStructDef(node: StructDefNode, args?: Record<string, any>) {
        const type = node.object.accept(this, args);
        if (type !== undefined) {
            const t = type as Types;
            if (t.tag == "TRec" && t.trec.name == "map") {
                t.trec.name = node.name;

                return t;
            }
        }
    }

    visitStruct(
        node: StructNode,
        { frame }: { frame: Frame }
    ) {
        const name = node.name;

        set_symbol(name, node, frame);
    }

    visitField(node: FieldNode, args?: Record<string, any>) {
        const name = node.field.name;
        let type = undefined;

        if (node.field.data_type)
            type = node.field.data_type?.accept(this, args);

        return {
            magic: "field",
            name,
            type
        }
    }

    visitNumber(
        node: NumberNode,
        { frame }: { frame: Frame }
    ): Types {
        const tc = lookup_symbol(`tcon:integer`, frame);
        const p = tcon("integer");
        if (p.tag == "TCon")
            p.tcon.constraints = [...tc]

        return p;
    }

    visitString(
        node: StringNode,
        { frame }: { frame: Frame }
    ): Types {
        const tc = lookup_symbol(`tcon:string`, frame);
        const p = tcon("string");
        if (p.tag == "TCon")
            p.tcon.constraints = [...tc];

        return p;
    }

    exit() {
        try {
            this.subst = this.hm.solve();
        } catch (e: any) {
            throw new Error(e.message)
        }
    }
}
