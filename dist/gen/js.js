"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JS = void 0;
const types_1 = require("../types");
class JS {
    constructor(builtin) {
        this.builtin = builtin;
        this.codeBuffer = [];
        this.plugins = [];
        this.indentLevel = 0;
    }
    write(code) {
        this.codeBuffer.push(code);
    }
    plugin(p) {
        this.plugins.push(p);
        return this;
    }
    before_accept(node, args) {
        // console.log(node.type)
        switch (node.type) {
            case "Let":
            case "ExpressionStatement":
            case "Return": {
                this.increaseIndent();
                this.codeBuffer.push(this.indent());
            }
        }
        this.plugins.forEach(plugin => { var _a; return (_a = plugin.beforeAccept) === null || _a === void 0 ? void 0 : _a.call(plugin, node, this, args); });
    }
    visit(node, args) {
        if (node == undefined)
            return;
        const handledByPlugin = this.plugins.some(plugin => { var _a; return (_a = plugin.handleNode) === null || _a === void 0 ? void 0 : _a.call(plugin, node, this, args); });
        if (!handledByPlugin) {
            node.accept(this, args);
        }
    }
    after_accept(node, args) {
        this.plugins.forEach(plugin => { var _a; return (_a = plugin.afterAccept) === null || _a === void 0 ? void 0 : _a.call(plugin, node, this, args); });
        switch (node.type) {
            case "Let":
            case "ExpressionStatement":
            case "Return":
            case "Struct":
            case "FunctionDec": {
                this.decreaseIndent();
            }
        }
    }
    create_args(args) {
        return args.map(arg => {
            if (typeof arg == "string") {
                return new types_1.StringNode(arg);
            }
            else if (typeof arg == "boolean") {
                return new types_1.BooleanNode(arg);
            }
            else if (typeof arg == "number") {
                return new types_1.NumberNode(arg);
            }
            else if (typeof arg == "object" && arg !== null) {
                if (Array.isArray(arg)) {
                    return new types_1.ArrayNode(this.create_args(arg));
                }
                else {
                    const props = Object.entries(arg)
                        .map(([key, value]) => {
                        return new types_1.PropertyNode(key, this.create_args([value])[0]);
                    });
                    return new types_1.ObjectNode(props);
                }
            }
            throw new Error(`Unsupported argument type: ${typeof arg}`);
        });
    }
    init(ast, opts) {
        ast.sources.push(new types_1.ExpressionStatementNode(new types_1.CallExpressionNode(new types_1.IdentifierNode(opts.main), this.create_args(opts.args))));
        this.visit(ast, {
            target: opts.target,
            main: opts.main
        });
    }
    run(ast, opts) {
        this.codeBuffer = [];
        this.indentLevel = 0;
        this.init(ast, opts);
        return this;
    }
    code() {
        return this.codeBuffer.join('');
    }
    indent() {
        if (this.indentLevel <= 0)
            return "";
        return '    '.repeat(this.indentLevel);
    }
    increaseIndent() {
        this.indentLevel++;
    }
    decreaseIndent() {
        this.indentLevel--;
    }
    visitSourceElements(node, args) {
        node.sources.forEach(src => {
            this.visit(src, args);
        });
    }
    visitExpressionStatement(node, args) {
        this.visit(node.expression, args);
        this.codeBuffer.push(`;`);
    }
    visitFunctionDec(node, args) {
        if (node.is_async)
            this.codeBuffer.push("async ");
        this.codeBuffer.push(`function ${node.identifier}(`);
        if (node.params) {
            this.increaseIndent();
            this.visit(node.params, args);
            this.decreaseIndent();
        }
        this.codeBuffer.push(") ");
        this.visit(node.body, args);
        this.codeBuffer.push("\n\n");
    }
    visitLambda(node, args) {
        this.codeBuffer.push("(");
        this.visit(node.params, args);
        this.codeBuffer.push(") => ");
        node.body.accept(this, args);
    }
    visitParametersList(node, args) {
        node.parameters.forEach((p, index) => {
            if (index > 0)
                this.codeBuffer.push(", ");
            this.visit(p, args);
        });
    }
    visitParameter(node, args) {
        this.visit(node.identifier, args);
    }
    visitBlock(node, args) {
        this.codeBuffer.push("{\n");
        node.body.forEach((b, index) => {
            this.visit(b, args);
            if (index < node.body.length - 1)
                this.codeBuffer.push(`\n`);
        });
        this.codeBuffer.push(`\n${this.indent()}}`);
    }
    visitReturn(node, args) {
        this.codeBuffer.push(`return`);
        if (node.expression) {
            this.codeBuffer.push(` `);
            this.visit(node.expression, args);
        }
        this.codeBuffer.push(`;`);
    }
    visitCallExpression(node, args) {
        this.visit(node.callee, args);
        this.codeBuffer.push("(");
        node.args.map((arg, index) => {
            this.visit(arg, args);
            if (index < node.args.length - 1)
                this.codeBuffer.push(", ");
        });
        this.codeBuffer.push(")");
    }
    visitMemberExpression(node, args) {
        this.visit(node.object, args);
        if (node.computed) {
            this.codeBuffer.push("[");
            this.visit(node.property, args);
            this.codeBuffer.push("]");
        }
        else {
            this.codeBuffer.push(".");
            this.visit(node.property, args);
        }
    }
    visitVariableList(node, args) {
        this.codeBuffer.push(`let `);
        node.variables.forEach((v, index) => {
            if (index > 0)
                this.codeBuffer.push(", ");
            this.visit(v, args);
        });
        this.codeBuffer.push(`;`);
    }
    visitVariable(node, args) {
        this.visit(node.identifier, args);
        if (node.expression) {
            this.codeBuffer.push(` = `);
            this.visit(node.expression, args);
        }
    }
    visitBinaryOp(node, args) {
        this.codeBuffer.push("(");
        this.visit(node.left, args);
        this.codeBuffer.push(` ${node.operator} `);
        this.visit(node.right, args);
        this.codeBuffer.push(")");
    }
    visitIfElse(node, args) {
        this.codeBuffer.push("if (");
        this.visit(node.condition, args);
        this.codeBuffer.push(") ");
        this.visit(node.consequent, args);
        //node.alternate?.accept(this, args);
    }
    visitAwaitExpression(node, args) {
        this.codeBuffer.push("await ");
        this.visit(node.expression, Object.assign({ promise: true }, args));
    }
    visitIdentifier(node, args) {
        this.codeBuffer.push(node.name);
    }
    visitStructDef(node, args) {
        this.write(`new ${node.name}(`);
        this.visit(node.object, args);
        this.write(")");
    }
    visitStruct(node, args) {
        this.write(`class ${node.name} {\n`);
        this.increaseIndent();
        this.write(`${this.indent()}constructor ({`);
        node.body.map((f, index) => {
            this.visit(f, args);
            if (index < node.body.length - 1)
                this.write(", ");
        });
        this.write("}) {\n");
        this.increaseIndent();
        node.body.map(f => {
            this.write(`${this.indent()}this.`);
            this.visit(f, args);
            this.write(" = ");
            this.visit(f, args);
            this.write(";\n");
        });
        this.decreaseIndent();
        this.write(`${this.indent()}}\n}\n\n`);
    }
    visitField(node, args) {
        this.visit(node.field, args);
    }
    visitObject(node, args) {
        this.codeBuffer.push("{");
        node.properties.map((p, index) => {
            this.visit(p, args);
            if (index < node.properties.length - 1)
                this.codeBuffer.push(", ");
        });
        this.codeBuffer.push("}");
    }
    visitProperty(node, args) {
        this.codeBuffer.push(`${node.key} : `);
        this.visit(node.value, args);
    }
    visitArray(node, args) {
        this.codeBuffer.push("[");
        node.elements.map((elem, index) => {
            this.visit(elem, args);
            if (index < node.elements.length - 1)
                this.codeBuffer.push(", ");
        });
        this.codeBuffer.push("]");
    }
    visitBoolean(node, args) {
        this.codeBuffer.push(`${node.value ? 'true' : 'false'}`);
    }
    visitNumber(node, args) {
        this.codeBuffer.push(`${node.value}`);
    }
    visitString(node, args) {
        this.codeBuffer.push(`'${node.value}'`);
    }
}
exports.JS = JS;
