import { ASTNode, ASTVisitor, BinaryOpNode, BlockNode, Builtin, CallExpressionNode, ContinuationNode, ExpressionStatementNode, FunctionDecNode, IdentifierNode, LambdaNode, NumberNode, ParameterNode, ParametersListNode, ReturnNode, SourceElementsNode, VariableListNode, VariableNode } from "../types";

/**
 * Desugar to Continuation passing style
 */
export class CPS implements ASTVisitor {

    public before_accept(node: ASTNode) {
        console.log(node.type);
    }

    public run(
        ast: ASTNode,
        builtin: Record<string, Builtin>
    ) {
        const res = ast.accept(this, {
            cont: (x: any) => x,
            isStatement: true
        });

        console.log(res);
        return res;
    }

    visitSourceElements(
        node: SourceElementsNode,
        { cont }: { cont: Function }
    ) {
        const transformedSources = node.sources.map(source =>
            source.accept(this, { cont: (x: any) => x, isStatement: true })
        );

        return new SourceElementsNode(transformedSources);
    }

    visitExpressionStatement(
        node: ExpressionStatementNode,
        { cont }: { cont: Function }
    ) {
    }

    visitVariableList(
        node: VariableListNode,
        { cont }: { cont: Function }
    ) {
    }

    visitBinaryOp(
        node: BinaryOpNode,
        { cont }: { cont: Function }
    ) {
    }

    visitNumber(
        node: NumberNode,
        { cont }: { cont: Function }
    ) {
    }
}