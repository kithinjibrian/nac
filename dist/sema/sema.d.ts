import { Frame } from "../dsa/symtab";
import { Extension } from "../plugin/plugin";
import { ASTNode, ASTVisitor, BlockNode, Builtin, CallExpressionNode, ExpressionStatementNode, FunctionDecNode, IdentifierNode, ParameterNode, ParametersListNode, ReturnNode, SourceElementsNode, StructNode, VariableListNode, VariableNode } from "../types";
export declare class SEMA implements ASTVisitor {
    private plugins;
    global: Frame;
    private errors;
    error(err: String): void;
    plugin(p: Extension<any>): this;
    before_accept(node: ASTNode, args?: Record<string, any>): void;
    visit(node?: ASTNode, args?: Record<string, any>): void;
    after_accept(node: ASTNode, args?: Record<string, any>): void;
    run(ast: ASTNode, builtin: Record<string, Builtin>): ASTNode;
    visitSourceElements(node: SourceElementsNode, args?: Record<string, any>): void;
    visitExpressionStatement(node: ExpressionStatementNode, args?: Record<string, any>): void;
    visitFunctionDec(node: FunctionDecNode, { frame }: {
        frame: Frame;
    }): void;
    visitParametersList(node: ParametersListNode, args?: Record<string, any>): void;
    visitParameter(node: ParameterNode, { frame }: {
        frame: Frame;
    }): void;
    visitBlock(node: BlockNode, { frame }: {
        frame: Frame;
    }): void;
    visitReturn(node: ReturnNode, { frame }: {
        frame: Frame;
    }): void;
    visitVariableList(node: VariableListNode, { frame }: {
        frame: Frame;
    }): void;
    visitVariable(node: VariableNode, { frame }: {
        frame: Frame;
    }): void;
    visitCallExpression(node: CallExpressionNode, { frame }: {
        frame: Frame;
    }): void;
    visitStruct(node: StructNode, { frame }: {
        frame: Frame;
    }): void;
    visitIdentifier(node: IdentifierNode, { frame }: {
        frame: Frame;
    }): any;
}
//# sourceMappingURL=sema.d.ts.map