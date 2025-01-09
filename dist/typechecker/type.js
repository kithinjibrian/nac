"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeChecker = exports.structTypeClass = exports.showTypeClass = exports.eqTypeClass = exports.ordTypeClass = exports.stringTypeClass = exports.numericTypeClass = void 0;
const ast_1 = require("../parser/ast");
const lexer_1 = require("../lexer/lexer");
const parser_1 = require("../parser/parser");
const symtab_1 = require("../dsa/symtab");
const hm_1 = require("./hm");
exports.numericTypeClass = {
    name: "Num",
    methods: ["+", "-", "*", "/"]
};
exports.stringTypeClass = {
    name: "Stringable",
    methods: ["+"]
};
exports.ordTypeClass = {
    name: "Ord",
    methods: ["<", ">", "<=", ">="]
};
exports.eqTypeClass = {
    name: "Eq",
    methods: ["==", "!="]
};
exports.showTypeClass = {
    name: "Show",
    methods: ["str"]
};
exports.structTypeClass = {
    name: "Struct",
    methods: []
};
class TypeChecker {
    constructor(opts = {}, primitives = ["integer", "float", "boolean", "string"]) {
        this.opts = opts;
        this.primitives = primitives;
        this.hm = new hm_1.HM();
        this.global = (0, symtab_1.new_frame)(null);
        this.subst = new Map();
        Object.assign(this.hm.opts, opts);
    }
    run(ast, builtin) {
        this._run(ast, builtin);
        return ast;
    }
    _run(ast, builtin) {
        this.enter({ frame: this.global });
        Object.entries(builtin)
            .map(([key, value]) => {
            if (value.type == "function" ||
                value.type == "variable") {
                this.global.symbol_table.set(key, this.proc_builtin({ node: value }));
            }
        });
        const ret = ast.accept(this, { frame: this.global });
        this.exit();
        return ret;
    }
    get_type(code) {
        const lexer = new lexer_1.Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new parser_1.Parser(tokens);
        const ast = parser.type();
        const tc = new TypeChecker();
        return tc._run(ast, {});
    }
    proc_builtin({ node }) {
        if (node.type == "function") {
            const ftype = this.get_type(node.signature);
            if (ftype !== undefined) {
                return ftype;
            }
        }
        return (0, hm_1.tcon)("void");
    }
    enter({ frame }) {
        (0, symtab_1.set_symbol)("tc:Num", exports.numericTypeClass, frame);
        (0, symtab_1.set_symbol)("tc:Stringable", exports.stringTypeClass, frame);
        (0, symtab_1.set_symbol)("tc:Ord", exports.ordTypeClass, frame);
        (0, symtab_1.set_symbol)("tc:Eq", exports.eqTypeClass, frame);
        (0, symtab_1.set_symbol)("tc:Show", exports.showTypeClass, frame);
        (0, symtab_1.set_symbol)("tc:Struct", exports.structTypeClass, frame);
        (0, symtab_1.set_symbol)("tcon:integer", [exports.showTypeClass, exports.numericTypeClass, exports.ordTypeClass, exports.eqTypeClass], frame);
        (0, symtab_1.set_symbol)("tcon:float", [exports.showTypeClass, exports.numericTypeClass, exports.ordTypeClass, exports.eqTypeClass], frame);
        (0, symtab_1.set_symbol)("tcon:string", [exports.showTypeClass, exports.stringTypeClass, exports.eqTypeClass], frame);
    }
    addTypeClassConstraint(type, typeClass) {
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
    checkTypeClassConstraints(type, requiredClass, frame) {
        const constraints = type.tag === "TVar" ? type.constraints :
            type.tag === "TCon" ? type.tcon.constraints :
                type.tag === "TRec" ? type.trec.constraints : [];
        if (constraints.some(tc => tc.name === requiredClass.name)) {
            return true;
        }
        if (type.tag === "TCon") {
            const instances = (0, symtab_1.lookup_symbol)(`tcon:${type.tcon.name}`, frame);
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
    typeToString(type) {
        return type.tag === "TCon" ? type.tcon.name : type.tag === "TRec" ? type.trec.name : type.tvar;
    }
    before_accept(node) {
        //console.log(node.type);
    }
    visitSourceElements(node, args) {
        const result = [];
        for (const n of node.sources) {
            const r = n.accept(this, args);
            if (r !== undefined)
                result.push(r);
        }
        return result;
    }
    visitExpressionStatement(node, args) {
        return node.expression.accept(this, args);
    }
    visitLambda(node, { frame }) {
        var _a, _b;
        const nf = (0, symtab_1.new_frame)(frame);
        let types = [];
        if (node.params) {
            const ts = node.params.accept(this, { frame: nf });
            if (ts !== undefined)
                types = ts;
        }
        const body = node.body.accept(this, { frame: nf });
        const returnType = (_b = (_a = node.return_type) === null || _a === void 0 ? void 0 : _a.accept(this, { frame: nf })) !== null && _b !== void 0 ? _b : (0, hm_1.tvar)();
        if (body !== undefined) {
            for (const retType of body) {
                this.hm.constraint_eq(returnType, retType);
            }
        }
        let ftype = (0, hm_1.tfun)(types, node.is_async
            ? (0, hm_1.tcon_ex)("promise", [returnType])
            : returnType);
        return ftype;
    }
    visitFunctionDec(node, { frame }) {
        var _a, _b;
        const nf = (0, symtab_1.new_frame)(frame);
        if (node.type_parameters) {
            node.type_parameters.forEach(tp => {
                tp.accept(this, { frame });
            });
        }
        let types = [];
        if (node.params) {
            const ts = node.params.accept(this, { frame: nf });
            if (ts !== undefined)
                types = ts;
        }
        const body = node.body.accept(this, { frame: nf });
        const returnType = (_b = (_a = node.return_type) === null || _a === void 0 ? void 0 : _a.accept(this, { frame: nf })) !== null && _b !== void 0 ? _b : (0, hm_1.tvar)();
        if (body !== undefined) {
            for (const retType of body) {
                this.hm.constraint_eq(returnType, retType);
            }
        }
        let ftype = (0, hm_1.tfun)(types, node.is_async
            ? (0, hm_1.tcon_ex)("promise", [returnType])
            : returnType);
        (0, symtab_1.set_symbol)(node.identifier, ftype, frame);
        return ftype;
    }
    visitParametersList(node, args) {
        const params = [];
        for (const n of node.parameters) {
            const t = n.accept(this, args);
            if (t !== undefined)
                params.push(t);
        }
        return params;
    }
    visitParameter(node, { frame }) {
        if (node.identifier.data_type) {
            const t = node.identifier.data_type.accept(this, { frame });
            if (t !== undefined) {
                (0, symtab_1.set_symbol)(node.identifier.name, t, frame);
                return t;
            }
        }
        const paramType = node.variadic ? (0, hm_1.tcon_ex)("array", [(0, hm_1.tvar)()]) : (0, hm_1.tvar)();
        (0, symtab_1.set_symbol)(node.identifier.name, paramType, frame);
        return paramType;
    }
    visitBlock(node, { frame }) {
        const nf = (0, symtab_1.new_frame)(frame);
        let lastType = undefined;
        let returnTypes = [];
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
    visitReturn(node, { frame }) {
        frame.return_flag = true;
        if (node.expression) {
            const exprType = node.expression.accept(this, { frame });
            if (exprType !== undefined) {
                frame.return_value = exprType;
                return exprType;
            }
        }
        frame.return_value = (0, hm_1.tcon)("void");
        return (0, hm_1.tcon)("void");
    }
    visitIfElse(node, args) {
        var _a;
        const cond = node.condition.accept(this, args);
        if (cond !== undefined)
            this.hm.constraint_eq(cond, (0, hm_1.tcon)("boolean"));
        const ctype = node.consequent.accept(this, args);
        (_a = node.alternate) === null || _a === void 0 ? void 0 : _a.accept(this);
        return ctype;
    }
    visitVariableList(node, args) {
        for (const n of node.variables) {
            const result = n.accept(this, args);
            if (result !== undefined)
                return result;
        }
    }
    visitVariable(node, { frame }) {
        const existing = (0, symtab_1.lookup_symbol)(node.identifier.name, frame);
        if (existing)
            return existing;
        let def_type = undefined;
        if (node.identifier.data_type) {
            def_type = node.identifier.data_type.accept(this, { frame });
        }
        if (node.expression) {
            const inferredType = node.expression.accept(this, { frame });
            if (inferredType !== undefined) {
                node.data_type = inferredType;
                (0, symtab_1.set_symbol)(node.identifier.name, inferredType, frame);
            }
            ;
            if (def_type !== undefined && inferredType !== undefined) {
                this.hm.constraint_eq(def_type, inferredType);
                let dt = def_type;
                if (dt.tag == "TRec") {
                    if (dt.trec.name !== "Map") {
                        return dt;
                    }
                }
            }
            return inferredType;
        }
    }
    visitAssignmentExpression(node, { frame }) {
        const left = node.left.accept(this, { frame });
        const right = node.right.accept(this, { frame });
        if (left == undefined || right == undefined) {
            throw new Error("Invalid operands");
        }
        this.hm.constraint_eq(left, right);
        if (node.left instanceof ast_1.IdentifierNode) {
            (0, symtab_1.set_symbol)(node.left.name, left, frame);
        }
    }
    visitBinaryOp(node, { frame }) {
        const left = node.left.accept(this, { frame });
        const right = node.right.accept(this, { frame });
        if (left == undefined || right == undefined) {
            throw new Error("Invalid operands");
        }
        switch (node.operator) {
            case "+": {
                const numClass = (0, symtab_1.lookup_symbol)("tc:Num", frame);
                const stringClass = (0, symtab_1.lookup_symbol)("tc:Stringable", frame);
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
                throw new Error(`Operator '+' requires either Num or Stringable type class for types ${this.typeToString(left)} and ${this.typeToString(right)}`);
            }
            case "-":
            case "*":
            case "/": {
                const numClass = (0, symtab_1.lookup_symbol)("tc:Num", frame);
                if (!this.checkTypeClassConstraints(left, numClass, frame) ||
                    !this.checkTypeClassConstraints(right, numClass, frame)) {
                    throw new Error(`Operator '${node.operator}' requires Num type class for types ${this.typeToString(left)} and ${this.typeToString(right)}`);
                }
                this.hm.constraint_eq(left, right);
                return left;
            }
            case "<":
            case ">":
            case "<=":
            case ">=": {
                const ordClass = (0, symtab_1.lookup_symbol)("tc:Ord", frame);
                if (!this.checkTypeClassConstraints(left, ordClass, frame) ||
                    !this.checkTypeClassConstraints(right, ordClass, frame)) {
                    throw new Error(`Comparison requires Ord type class for types ${this.typeToString(left)} and ${this.typeToString(right)}`);
                }
                this.hm.constraint_eq(left, right);
                return (0, hm_1.tcon)("boolean");
            }
            case "==":
            case "!=": {
                const eqClass = (0, symtab_1.lookup_symbol)("tc:Eq", frame);
                if (!this.checkTypeClassConstraints(left, eqClass, frame) ||
                    !this.checkTypeClassConstraints(right, eqClass, frame)) {
                    throw new Error(`Equality comparison requires Eq type class for types ${this.typeToString(left)} and ${this.typeToString(right)}`);
                }
                this.hm.constraint_eq(left, right);
                return (0, hm_1.tcon)("boolean");
            }
        }
        throw new Error(`Unsupported operator: ${node.operator}`);
    }
    visitAwaitExpression(node, args) {
        const type = node.expression.accept(this, Object.assign({ promisify: true }, args));
        if (type !== undefined) {
            if (type.tag == "TCon") {
                return type.tcon.types[0];
            }
        }
        return type;
    }
    visitCallExpression(node, _a) {
        var { promisify } = _a, args = __rest(_a, ["promisify"]);
        const callee = node.callee.accept(this, args);
        const _args = [];
        node.args.forEach((a) => {
            const y = a.accept(this, args);
            if (y !== undefined)
                _args.push(y);
        });
        const ret = (0, hm_1.tvar)();
        const retType = promisify
            ? (0, hm_1.tcon_ex)("Promise", [ret])
            : ret;
        const ftype = (0, hm_1.tfun)(_args, retType);
        if (callee !== undefined)
            this.hm.constraint_eq(callee, ftype);
        return retType;
    }
    visitMemberExpression(node, args) {
        const t = node.object.accept(this, args);
        const key = node.property.name;
        if (t != undefined) {
            if (t instanceof ast_1.EnumNode) {
                const enumType = t.accept(this, args);
                const v_index = t.body.findIndex(variant => variant.name == key);
                if (v_index == -1)
                    return;
                const v_type = t.body[v_index].accept(this, args);
                if (enumType == undefined || v_type == undefined)
                    return;
                const et = enumType;
                if (et.tag == "TCon") {
                    et.tcon.types[v_index] = v_type;
                    return et;
                }
            }
            else {
                const tp = t;
                if (tp.tag == "TCon") {
                    if (tp.tcon.name == "Array") {
                        return tp.tcon.types[0];
                    }
                }
                else if (tp.tag == "TRec") {
                    return tp.trec.types[key];
                }
                else if (tp.tag == "TVar") {
                    const t = (0, hm_1.tvar)();
                    // there are issues here
                    return t;
                }
            }
        }
    }
    visitIdentifier(node, { frame }) {
        const type = (0, symtab_1.lookup_symbol)(node.name, frame);
        if (type)
            return type;
        return (0, hm_1.tvar)();
    }
    visitGenericType(node, { frame }) {
        node.type_parameters.forEach(tp => {
            tp.accept(this, { frame });
        });
        return node.base_type.accept(this, { frame });
    }
    visitTypeParameter(node, { frame, type }) {
        const tv = type !== null && type !== void 0 ? type : (0, hm_1.tvar)();
        if (node.constraints) {
            node.constraints.forEach(str => {
                const tc = (0, symtab_1.lookup_symbol)(`tc:${str}`, frame);
                if (tv.tag == "TVar")
                    tv.constraints.push(tc);
            });
        }
        (0, symtab_1.set_symbol)(`T:${node.name}`, tv, frame);
        return tv;
    }
    resolve_type(node, typeName, frame) {
        if (node.types) {
            const elem = node.types[0].accept(this, { frame });
            return (0, hm_1.tcon_ex)(typeName, [elem]);
        }
        throw new Error(`Expected type parameters for ${typeName}`);
    }
    visitType(node, { frame }) {
        if (node.name == "->") {
            if (node.types) {
                const params = node.types[0].accept(this, { frame });
                const retType = node.types[1].accept(this, { frame });
                return (0, hm_1.tfun)(params, retType);
            }
        }
        else if (node.name == "Array") {
            return this.resolve_type(node, "Array", frame);
        }
        else if (node.name == "Promise") {
            return this.resolve_type(node, "Promise", frame);
        }
        else if (node.name == "Map") {
            if (node.types) {
                const val = node.types[1].accept(this, { frame });
                return (0, hm_1.tcon_ex)("Map", [val]);
            }
        }
        else if (node.name == "struct") {
            if (node.types) {
                const type_parameters = [];
                for (let a = 1; a < node.types.length; a++) {
                    type_parameters.push(node.types[a].accept(this, { frame }));
                }
                const type = this.typeStruct(node, {
                    frame,
                    type_parameters
                });
                if (type !== undefined) {
                    return type;
                }
            }
        }
        else if (node.name == "enum") {
            const type = this.typeEnum(node, { frame });
            if (type !== undefined)
                return type;
        }
        else if (this.primitives.includes(node.name)) {
            const tc = (0, symtab_1.lookup_symbol)(`tcon:${node.name}`, frame);
            const p = (0, hm_1.tcon)(node.name);
            if (p.tag == "TCon")
                p.tcon.constraints = [...tc];
            return p;
        }
        else {
            const tvar = (0, symtab_1.lookup_symbol)(`T:${node.name}`, frame);
            if (tvar) {
                return tvar;
            }
            throw new Error(`Couldn't find generic type <${node.name}>`);
        }
    }
    typeStruct(node, { frame, type_parameters }) {
        if (!node.types)
            return;
        const name = node.types[0];
        const struct_node = (0, symtab_1.lookup_symbol)(name, frame);
        if (!struct_node) {
            throw new Error(`Enum ${name} not found`);
        }
        return struct_node.accept(this, { frame, type_parameters });
    }
    typeEnum(node, { frame }) {
        if (!node.types)
            return;
        const name = node.types[0];
        const enum_node = (0, symtab_1.lookup_symbol)(name, frame);
        if (!enum_node) {
            throw new Error(`Enum ${name} not found`);
        }
        return enum_node.accept(this, { frame });
    }
    enum_variant_type(variant, frame) {
        if (variant.value) {
        }
        return (0, hm_1.tcon)("int");
    }
    visitArray(node, args) {
        const types = [];
        node.elements.forEach((a, index) => {
            const t = a.accept(this, args);
            if (t !== undefined) {
                types.push(t);
                if (index > 0) {
                    this.hm.constraint_eq(types[0], t);
                }
            }
        });
        if (types.length == 0) {
            return (0, hm_1.tcon_ex)("Array", [(0, hm_1.tcon)("unknown")]);
        }
        return (0, hm_1.tcon_ex)("Array", [types[0]]);
    }
    visitObject(node, args) {
        const types = {};
        node.properties.forEach((a, index) => {
            const key = a.key;
            const val = a.value.accept(this, args);
            if (val !== undefined)
                types[key] = val;
        });
        return {
            tag: "TRec",
            trec: {
                name: "Map",
                types,
                constraints: []
            }
        };
    }
    visitStructDef(node, args) {
        const type = node.object.accept(this, args);
        if (type !== undefined) {
            const t = type;
            if (t.tag == "TRec" && t.trec.name == "Map") {
                t.trec.name = node.name;
                return t;
            }
        }
    }
    visitEnum(node, { frame }) {
        const name = node.name;
        const types = [];
        node.body.forEach(variant => {
            const type = variant.accept(this, { frame });
            if (type !== undefined)
                types.push(type);
        });
        const a = {
            tag: "TCon",
            tcon: {
                name,
                types,
                constraints: []
            }
        };
        if (!(0, symtab_1.lookup_symbol)(node.name, frame))
            (0, symtab_1.set_symbol)(node.name, node, frame);
        return a;
    }
    visitEnumVariant(node, args) {
        let types = [];
        if (node.value) {
            const t = node.value.accept(this, args);
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
        };
    }
    visitConstantVariant(node, args) {
        return node.types.accept(this, args);
    }
    visitStruct(node, { frame, type_parameters }) {
        const name = node.name;
        const types = {};
        if (node.type_parameters) {
            node.type_parameters.forEach((t, index) => {
                const type = type_parameters ? type_parameters[index] : (0, hm_1.tvar)();
                t.accept(this, { frame, type });
            });
        }
        node.body.forEach(b => {
            const t = b.accept(this, { frame });
            if (t !== undefined) {
                const _t = t;
                types[_t.name] = _t.type;
            }
        });
        if (!(0, symtab_1.lookup_symbol)(name, frame))
            (0, symtab_1.set_symbol)(name, node, frame);
        return {
            tag: "TRec",
            trec: {
                name,
                types,
                constraints: [exports.structTypeClass]
            }
        };
    }
    visitField(node, args) {
        const name = node.field.name;
        let type = undefined;
        if (node.field.data_type)
            type = node.field.data_type.accept(this, args);
        return {
            magic: "field",
            name,
            type
        };
    }
    visitNumber(node, { frame }) {
        const tc = (0, symtab_1.lookup_symbol)(`tcon:integer`, frame);
        const p = (0, hm_1.tcon)("integer");
        if (p.tag == "TCon")
            p.tcon.constraints = [...tc];
        return p;
    }
    visitString(node, { frame }) {
        const tc = (0, symtab_1.lookup_symbol)(`tcon:string`, frame);
        const p = (0, hm_1.tcon)("string");
        if (p.tag == "TCon")
            p.tcon.constraints = [...tc];
        return p;
    }
    exit() {
        try {
            this.subst = this.hm.solve();
        }
        catch (e) {
            throw new Error(e.message);
        }
    }
}
exports.TypeChecker = TypeChecker;
