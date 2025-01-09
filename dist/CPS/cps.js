"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CPS = void 0;
const types_1 = require("../types");
/**
 * Desugar to Continuation passing style
 */
class CPS {
    before_accept(node) {
        // console.log(node.type);
    }
    run(ast, builtin) {
        const res = ast.accept(this, {
            cont: (x) => x,
            isStatement: true
        });
        //  console.log(res);
        return res;
    }
    visitSourceElements(node, { cont }) {
        const transformedSources = node.sources.map(source => source.accept(this, { cont: (x) => x, isStatement: true }));
        return new types_1.SourceElementsNode(transformedSources);
    }
    visitExpressionStatement(node, { cont }) {
    }
    visitVariableList(node, { cont }) {
    }
    visitBinaryOp(node, { cont }) {
    }
    visitNumber(node, { cont }) {
    }
}
exports.CPS = CPS;
