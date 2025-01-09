"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEMA = void 0;
const symtab_1 = require("../dsa/symtab");
const types_1 = require("../types");
class SEMA {
    constructor() {
        this.plugins = [];
        this.global = (0, symtab_1.new_frame)(null);
        this.errors = [];
    }
    error(err) {
        this.errors.push(err);
    }
    plugin(p) {
        this.plugins.push(p);
        return this;
    }
    before_accept(node, args) {
        // console.log(node.type)
        this.plugins.forEach(plugin => { var _a; return (_a = plugin.beforeAccept) === null || _a === void 0 ? void 0 : _a.call(plugin, node, this, args); });
    }
    visit(node, args) {
        if (node == undefined)
            return;
        const handledByPlugin = this.plugins.some(plugin => { var _a; return (_a = plugin.handleNode) === null || _a === void 0 ? void 0 : _a.call(plugin, node, this, args); });
        if (!handledByPlugin) {
            return node.accept(this, args);
        }
    }
    after_accept(node, args) {
        this.plugins.forEach(plugin => { var _a; return (_a = plugin.afterAccept) === null || _a === void 0 ? void 0 : _a.call(plugin, node, this, args); });
    }
    run(ast, builtin) {
        Object.entries(builtin)
            .map(([key, value]) => {
            if (value.type == "function") {
                this.global.symbol_table.set(key, new types_1.FunctionDecNode(key, undefined, new types_1.BlockNode([]), true));
            }
            else if (value.type == "variable") {
                this.global.symbol_table.set(key, new types_1.VariableNode(new types_1.IdentifierNode(key)));
            }
        });
        this.visit(ast, {
            frame: this.global
        });
        if (this.errors.length > 0)
            throw new Error(this.errors.join("\n"));
        return ast;
    }
    visitSourceElements(node, args) {
        node.sources.forEach(s => this.visit(s, args));
    }
    visitExpressionStatement(node, args) {
        this.visit(node.expression, args);
    }
    visitFunctionDec(node, { frame }) {
        (0, symtab_1.set_symbol)(node.identifier, node, frame);
        const nf = (0, symtab_1.new_frame)(frame);
        this.visit(node.params, { frame: nf });
        this.visit(node.body, { frame: nf });
    }
    visitParametersList(node, args) {
        node.parameters.forEach(p => this.visit(p, args));
    }
    visitParameter(node, { frame }) {
        const name = node.identifier.name;
        (0, symtab_1.set_symbol)(name, node, frame);
    }
    visitBlock(node, { frame }) {
        const nf = (0, symtab_1.new_frame)(frame);
        node.body.forEach(b => this.visit(b, { frame: nf }));
    }
    visitReturn(node, { frame }) {
        if (node.expression)
            this.visit(node.expression, { frame });
    }
    visitVariableList(node, { frame }) {
        node.variables.forEach(v => this.visit(v, { frame }));
    }
    visitVariable(node, { frame }) {
        const name = node.identifier.name;
        this.visit(node.expression, { frame });
        (0, symtab_1.set_symbol)(name, node, frame);
    }
    visitCallExpression(node, { frame }) {
        const res = this.visit(node.callee, { frame });
        node.args.forEach(a => this.visit(a, { frame }));
        if (res !== undefined && res instanceof types_1.FunctionDecNode) {
            const fun = res;
            if (fun.inbuilt)
                return;
            const len = fun.params.parameters.length;
            if (len !== node.args.length) {
                this.error(`Function '${fun.identifier}' expected ${len} argument(s) but got ${node.args.length}.`);
            }
        }
    }
    visitStruct(node, { frame }) {
        (0, symtab_1.set_symbol)(node.name, node, frame);
    }
    visitIdentifier(node, { frame }) {
        const iden = (0, symtab_1.lookup_symbol)(node.name, frame);
        if (!iden)
            this.error(`Symbol ${node.name} is undefined.`);
        return iden;
    }
}
exports.SEMA = SEMA;
