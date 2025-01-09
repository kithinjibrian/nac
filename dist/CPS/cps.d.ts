import { ASTNode, ASTVisitor, BinaryOpNode, Builtin, ExpressionStatementNode, NumberNode, SourceElementsNode, VariableListNode } from "../types";
/**
 * Desugar to Continuation passing style
 */
export declare class CPS implements ASTVisitor {
    before_accept(node: ASTNode): void;
    run(ast: ASTNode, builtin: Record<string, Builtin>): any;
    visitSourceElements(node: SourceElementsNode, { cont }: {
        cont: Function;
    }): SourceElementsNode;
    visitExpressionStatement(node: ExpressionStatementNode, { cont }: {
        cont: Function;
    }): void;
    visitVariableList(node: VariableListNode, { cont }: {
        cont: Function;
    }): void;
    visitBinaryOp(node: BinaryOpNode, { cont }: {
        cont: Function;
    }): void;
    visitNumber(node: NumberNode, { cont }: {
        cont: Function;
    }): void;
}
//# sourceMappingURL=cps.d.ts.map