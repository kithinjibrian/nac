"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JS = void 0;
class JS {
    constructor() {
        this.codeBuffer = [];
        this.indentLevel = 0;
    }
    before_accept(node) {
        console.log(node.type);
        switch (node.type) {
            case "Return": {
                this.increaseIndent();
                this.codeBuffer.push(this.indent());
            }
        }
    }
    after_accept(node) {
        switch (node.type) {
            case "Return": {
                this.decreaseIndent();
            }
            case "FunctionDec": {
            }
        }
    }
    run(ast, builtin) {
        this.codeBuffer = [];
        this.indentLevel = 0;
        ast.accept(this, {});
        console.log(this.codeBuffer.join(''));
        eval(this.codeBuffer.join(''));
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
            src.accept(this, args);
        });
    }
    visitExpressionStatement(node, args) {
        node.expression.accept(this, args);
        this.codeBuffer.push(`;\n`);
    }
    visitFunctionDec(node, args) {
        this.codeBuffer.push(`function ${node.identifier}(`);
        if (node.params) {
            this.increaseIndent();
            node.params.accept(this, args);
            this.decreaseIndent();
        }
        this.codeBuffer.push(") ");
        node.body.accept(this, args);
        this.codeBuffer.push("\n\n");
    }
    visitLambda(node, args) {
        var _a;
        this.codeBuffer.push("(");
        (_a = node.params) === null || _a === void 0 ? void 0 : _a.accept(this, args);
        this.codeBuffer.push(") => ");
        node.body.accept(this, args);
    }
    visitParametersList(node, args) {
        node.parameters.forEach((p, index) => {
            if (index > 0)
                this.codeBuffer.push(", ");
            p.accept(this, args);
        });
    }
    visitParameter(node, args) {
        this.codeBuffer.push(`${node.identifier.accept(this, args)}`);
    }
    visitBlock(node, args) {
        this.codeBuffer.push("{\n");
        node.body.forEach(b => {
            b.accept(this, args);
        });
        this.codeBuffer.push(`\n${this.indent()}}`);
    }
    visitReturn(node, args) {
        this.codeBuffer.push(`return`);
        if (node.expression) {
            this.codeBuffer.push(` `);
            node.expression.accept(this, args);
        }
        this.codeBuffer.push(`;`);
    }
    visitCallExpression(node, args) {
        node.callee.accept(this, args);
        this.codeBuffer.push("(");
        node.args.map(arg => arg.accept(this, args)).join(', ');
        this.codeBuffer.push(")");
    }
    visitVariableList(node, args) {
        this.codeBuffer.push(`let `);
        node.variables.forEach((v, index) => {
            if (index > 0)
                this.codeBuffer.push(", ");
            v.accept(this, args);
        });
        this.codeBuffer.push(`;\n`);
    }
    visitVariable(node, args) {
        node.identifier.accept(this, args);
        if (node.expression) {
            this.codeBuffer.push(` = `);
            node.expression.accept(this, args);
        }
    }
    visitBinaryOp(node, args) {
        this.codeBuffer.push("(");
        node.left.accept(this, args);
        this.codeBuffer.push(` ${node.operator} `);
        node.right.accept(this, args);
        this.codeBuffer.push(")");
    }
    visitIfElse(node, args) {
        this.codeBuffer.push("if (");
        node.condition.accept(this, args);
        this.codeBuffer.push(") ");
        node.consequent.accept(this, args);
        //node.alternate?.accept(this, args);
    }
    visitIdentifier(node, args) {
        this.codeBuffer.push(node.name);
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
