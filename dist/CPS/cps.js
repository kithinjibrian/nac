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
        const identityCont = new types_1.LambdaNode(new types_1.ParametersListNode([new types_1.ParameterNode(new types_1.IdentifierNode("x"), false)]), new types_1.BlockNode([new types_1.ReturnNode(new types_1.VariableNode(new types_1.IdentifierNode("x")))]));
        const res = ast.accept(this, { cont: identityCont });
        // console.log(JSON.stringify(res, null, 2))
        return res;
    }
    visitSourceElements(node, { cont }) {
        return node.sources.reduceRight((contExpr, sourceNode) => {
            return sourceNode.accept(this, { cont: contExpr });
        }, cont);
    }
    visitExpressionStatement(node, { cont }) {
        return node.expression.accept(this, { cont });
    }
    visitVariableList(node, { cont }) {
    }
    visitBinaryOp(node, { cont }) {
    }
    visitNumber(node, { cont }) {
        return new types_1.CallExpressionNode(cont, [node]);
    }
}
exports.CPS = CPS;
