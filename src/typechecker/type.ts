import {
    ArrayNode,
    ASTNode,
    ASTVisitor,
    AwaitExpressionNode,
    BinaryOpNode,
    BlockNode,
    CallExpressionNode,
    ConstantVariantNode,
    EnumNode,
    EnumVariantNode,
    ExpressionStatementNode,
    FieldNode,
    FunctionDecNode,
    GenericTypeNode,
    IdentifierNode,
    IfElseNode,
    LambdaNode,
    MemberExpressionNode,
    NumberNode,
    ObjectNode,
    ParameterNode,
    ParametersListNode,
    ReturnNode,
    SourceElementsNode,
    StringNode,
    StructDefNode,
    StructNode,
    TypeNode,
    TypeParameterNode,
    VariableListNode,
    VariableNode
} from "../parser/ast";

import { Lexer } from "../lexer/lexer";
import { Parser } from "../parser/parser";
import { Builtin } from "../phases/phases";
import { Frame, lookup_symbol, new_frame, set_symbol } from "../dsa/symtab"
import { HM, tcon, tcon_ex, tfun, tvar } from "./hm";

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

export const structTypeClass: TypeClass = {
    name: "Struct",
    methods: []
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
        this._run(ast, builtin);
        return ast;
    }

    public _run(
        ast: ASTNode,
        builtin: Record<string, Builtin>
    ) {
        this.enter({ frame: this.global });

        Object.entries(builtin)
            .map(([key, value]) => {
                if (
                    value.type == "function" ||
                    value.type == "variable"
                ) {
                    this.global.symbol_table.set(key, this.proc_builtin({ node: value }));
                }
            })

        const ret = ast.accept(this, { frame: this.global });

        this.exit();

        return ret;
    }

    private get_type(code: string) {
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.type();

        const tc = new TypeChecker();
        return tc._run(ast, {});
    }

    public proc_builtin({ node }: { node: Builtin }) {
        if (node.type == "function") {
            const ftype = this.get_type(node.signature);
            if (ftype !== undefined) {
                return ftype;
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
        set_symbol("tc:Struct", structTypeClass, frame);

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
        console.log(node.type);
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

    visitLambda(
        node: LambdaNode,
        { frame }: { frame: Frame }
    ) {
        const nf = new_frame(frame);

        let types: Types[] = [];
        if (node.params) {
            const ts = node.params.accept(this, { frame: nf });
            if (ts !== undefined)
                types = ts;
        }

        const body = node.body.accept(this, { frame: nf });

        const returnType = node.return_type?.accept(this, { frame: nf }) ?? tvar();

        if (body !== undefined) {
            for (const retType of (body as Types[])) {
                this.hm.constraint_eq(returnType, retType);
            }
        }

        let ftype = tfun(types,
            node.is_async
                ? tcon_ex("promise", [returnType])
                : returnType
        );

        return ftype;
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

        const returnType = node.return_type?.accept(this, { frame: nf }) ?? tvar();

        if (body !== undefined) {
            for (const retType of (body as Types[])) {
                this.hm.constraint_eq(returnType, retType);
            }
        }

        let ftype = tfun(types,
            node.is_async
                ? tcon_ex("promise", [returnType])
                : returnType
        );

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
                    if (dt.trec.name !== "Map") {
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

    visitAwaitExpression(node: AwaitExpressionNode, args?: Record<string, any>) {
        const type = node.expression.accept(this, {
            promisify: true,
            ...args
        });

        if (type !== undefined) {
            if (type.tag == "TCon") {
                return type.tcon.types[0];
            }
        }

        return type;
    }

    visitCallExpression(node: CallExpressionNode,
        { promisify, ...args }: { promisify: Boolean }
    ) {
        const callee = node.callee.accept(this, args);

        const _args: Types[] = [];

        node.args.forEach((a) => {
            const y = a.accept(this, args);
            if (y !== undefined)
                _args.push(y);
        });


        const ret = tvar();

        const retType = promisify
            ? tcon_ex("Promise", [ret])
            : ret;

        const ftype = tfun(_args, retType);

        if (callee !== undefined)
            this.hm.constraint_eq(callee, ftype);

        return retType;
    }

    visitMemberExpression(
        node: MemberExpressionNode,
        args?: Record<string, any>
    ) {
        const t = node.object.accept(this, args);

        const key = (node.property as IdentifierNode).name;

        if (t != undefined) {
            if (t instanceof EnumNode) {
                const enumType = t.accept(this, args);
                const v_index = t.body.findIndex(variant => variant.name == key);
                if (v_index == -1) return;

                const v_type = t.body[v_index].accept(this, args);

                if (enumType == undefined || v_type == undefined) return;

                const et = enumType as Types;
                if (et.tag == "TCon") {
                    et.tcon.types[v_index] = v_type;

                    return et;
                }
            } else {
                const tp = t as Types;
                if (tp.tag == "TCon") {
                    if (tp.tcon.name == "Array") {
                        return tp.tcon.types[0];
                    }
                } else if (tp.tag == "TRec") {
                    return tp.trec.types[key];
                } else if (tp.tag == "TVar") {
                    const t = tvar()
                    // there are issues here
                    return t;
                }
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
        { frame, type }: { frame: Frame, type: Types }
    ) {
        const tv: Types = type ?? tvar();

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

    resolve_type(node: TypeNode, typeName: string, frame: Frame): Types {
        if (node.types) {
            const elem = node.types[0].accept(this, { frame });
            return tcon_ex(typeName, [elem]);
        }
        throw new Error(`Expected type parameters for ${typeName}`);
    }

    visitType(
        node: TypeNode,
        { frame }: { frame: Frame }
    ): Types | void {
        if (node.name == "->") {
            if (node.types) {
                const params = node.types[0].accept(this, { frame });
                const retType = node.types[1].accept(this, { frame });
                return tfun(params, retType);
            }
        } else if (node.name == "Array") {
            return this.resolve_type(node, "Array", frame);
        } else if (node.name == "Promise") {
            return this.resolve_type(node, "Promise", frame);
        } else if (node.name == "Map") {
            if (node.types) {
                const val = node.types[1].accept(this, { frame });
                return tcon_ex("Map", [val]);
            }
        } else if (node.name == "struct") {
            if (node.types) {
                const type_parameters = [];
                for (let a = 1; a < node.types.length; a++) {
                    type_parameters.push(node.types[a].accept(this, { frame }))
                }

                const type = this.typeStruct(node, {
                    frame,
                    type_parameters
                })
                if (type !== undefined) {
                    return type;
                }
            }
        } else if (node.name == "enum") {
            const type = this.typeEnum(node, { frame })
            if (type !== undefined)
                return type;
        } else if (this.primitives.includes(node.name)) {
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

    typeStruct(
        node: TypeNode,
        {
            frame,
            type_parameters
        }: {
            frame: Frame,
            type_parameters?: any[]
        }
    ) {
        if (!node.types) return;

        const name = node.types[0];

        const struct_node: StructNode = lookup_symbol(name, frame);
        if (!struct_node) {
            throw new Error(`Enum ${name} not found`);
        }

        return struct_node.accept(this, { frame, type_parameters });
    }

    typeEnum(
        node: TypeNode,
        { frame }: { frame: Frame }
    ) {
        if (!node.types) return;

        const name = node.types[0];

        const enum_node: EnumNode = lookup_symbol(name, frame);
        if (!enum_node) {
            throw new Error(`Enum ${name} not found`);
        }

        return enum_node.accept(this, { frame });
    }

    enum_variant_type(
        variant: EnumVariantNode,
        frame: Frame
    ): Types {
        if (variant.value) {

        }

        return tcon("int");
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
            return tcon_ex("Array", [tcon("unknown")]);
        }

        return tcon_ex("Array", [types[0]])
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
                name: "Map",
                types,
                constraints: []
            }
        } as Types;
    }

    visitStructDef(node: StructDefNode, args?: Record<string, any>) {
        const type = node.object.accept(this, args);
        if (type !== undefined) {
            const t = type as Types;
            if (t.tag == "TRec" && t.trec.name == "Map") {
                t.trec.name = node.name;
                return t;
            }
        }
    }

    visitEnum(
        node: EnumNode,
        { frame }: { frame: Frame }
    ) {
        const name = node.name;
        const types: Types[] = [];
        node.body.forEach(variant => {
            const type = variant.accept(this, { frame });
            if (type !== undefined)
                types.push(type);
        })


        const a = {
            tag: "TCon",
            tcon: {
                name,
                types,
                constraints: []
            }
        } as Types;

        if (!lookup_symbol(node.name, frame))
            set_symbol(node.name, node, frame);

        return a;
    }

    visitEnumVariant(node: EnumVariantNode, args?: Record<string, any>) {
        let types: Types[] = [];
        if (node.value) {
            const t = node.value.accept(this, args)
            if (t !== undefined)
                types.push(t);
        }

        return {
            tag: "TCon",
            tcon: {
                name: node.name,
                types,
                constraints: []
            }
        } as Types;
    }

    visitConstantVariant(node: ConstantVariantNode, args?: Record<string, any>) {
        return node.types.accept(this, args)
    }

    visitStruct(
        node: StructNode,
        { frame, type_parameters }: { frame: Frame, type_parameters: any[] }
    ) {
        const name = node.name;
        const types: Record<string, Types> = {};

        if (node.type_parameters) {
            node.type_parameters.forEach((t, index) => {
                const type = type_parameters ? type_parameters[index] : tvar();
                t.accept(this, { frame, type });
            })
        }

        node.body.forEach(b => {
            const t = b.accept(this, { frame });
            if (t !== undefined) {
                const _t: any = t;
                types[_t.name] = _t.type;
            }
        })

        if (!lookup_symbol(name, frame))
            set_symbol(name, node, frame);

        return {
            tag: "TRec",
            trec: {
                name,
                types,
                constraints: [structTypeClass]
            }
        } as Types;
    }

    visitField(node: FieldNode, args?: Record<string, any>) {
        const name = node.field.name;
        let type = undefined;

        if (node.field.data_type)
            type = node.field.data_type.accept(this, args);

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
