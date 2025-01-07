import { ASTNode, ASTVisitor, BinaryOpNode, Builtin, CallExpressionNode, ExpressionStatementNode, NumberNode, SourceElementsNode, VariableListNode } from "../types";
/**
 * Desugar to Continuation passing style
 */
export declare class CPS implements ASTVisitor {
    before_accept(node: ASTNode): void;
    run(ast: ASTNode, builtin: Record<string, Builtin>): any;
    visitSourceElements(node: SourceElementsNode, { cont }: {
        cont: ASTNode;
    }): ASTNode;
    visitExpressionStatement(node: ExpressionStatementNode, { cont }: {
        cont: ASTNode;
    }): ASTNode;
    visitVariableList(node: VariableListNode, { cont }: {
        cont: ASTNode;
    }): void;
    visitBinaryOp(node: BinaryOpNode, { cont }: {
        cont: ASTNode;
    }): void;
    visitNumber(node: NumberNode, { cont }: {
        cont: ASTNode;
    }): CallExpressionNode;
}
//# sourceMappingURL=cps.d.ts.map