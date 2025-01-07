import { ASTNode, ASTVisitor, BinaryOpNode, BlockNode, BooleanNode, Builtin, CallExpressionNode, ExpressionStatementNode, FunctionDecNode, IdentifierNode, IfElseNode, LambdaNode, NumberNode, ParameterNode, ParametersListNode, ReturnNode, SourceElementsNode, StringNode, VariableListNode, VariableNode } from "../types";
export declare class JS implements ASTVisitor {
    private codeBuffer;
    private indentLevel;
    before_accept(node: ASTNode): void;
    after_accept(node: ASTNode): void;
    run(ast: ASTNode, builtin: Record<string, Builtin>): void;
    private indent;
    private increaseIndent;
    private decreaseIndent;
    visitSourceElements(node: SourceElementsNode, args?: Record<string, any>): void;
    visitExpressionStatement(node: ExpressionStatementNode, args?: Record<string, any>): void;
    visitFunctionDec(node: FunctionDecNode, args?: Record<string, any>): void;
    visitLambda(node: LambdaNode, args?: Record<string, any>): void;
    visitParametersList(node: ParametersListNode, args?: Record<string, any>): void;
    visitParameter(node: ParameterNode, args?: Record<string, any>): void;
    visitBlock(node: BlockNode, args?: Record<string, any>): void;
    visitReturn(node: ReturnNode, args?: Record<string, any>): void;
    visitCallExpression(node: CallExpressionNode, args?: Record<string, any>): void;
    visitVariableList(node: VariableListNode, args?: Record<string, any>): void;
    visitVariable(node: VariableNode, args?: Record<string, any>): void;
    visitBinaryOp(node: BinaryOpNode, args?: Record<string, any>): void;
    visitIfElse(node: IfElseNode, args?: Record<string, any>): void;
    visitIdentifier(node: IdentifierNode, args?: Record<string, any>): void;
    visitBoolean(node: BooleanNode, args?: Record<string, any>): void;
    visitNumber(node: NumberNode, args?: Record<string, any>): void;
    visitString(node: StringNode, args?: Record<string, any>): void;
}
//# sourceMappingURL=js.d.ts.map