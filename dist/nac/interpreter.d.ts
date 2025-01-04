import { ArrayNode, ASTNode, ASTVisitor, BinaryOpNode, BlockNode, CallExpressionNode, ExpressionStatementNode, ForNode, FunctionDecNode, IdentifierNode, IfElseNode, MemberExpressionNode, NumberNode, ObjectNode, ReturnNode, SourceElementsNode, StringNode, StructDefNode, VariableListNode, VariableNode, WhileNode } from "../parser/ast";
import { Builtin } from "../phases/phases";
import { Frame } from "../dsa/symtab";
import { EventLoop } from "./event";
export declare class Interpreter implements ASTVisitor {
    eventLoop: EventLoop;
    builtin: Record<string, Builtin>;
    global: Frame;
    insert(builtin: Record<string, Builtin>, symbol_table: Record<string, any>): void;
    run(ast: ASTNode, builtin: Record<string, Builtin>): void;
    private scheduleTask;
    execute_function(fn: FunctionDecNode, args: ASTNode[], frame: Frame): Promise<void>;
    before_accept(node: ASTNode): void;
    visitSourceElements(node: SourceElementsNode, args?: Record<string, any>): void;
    visitExpressionStatement(node: ExpressionStatementNode, args?: Record<string, any>): void;
    visitFunctionDec(node: FunctionDecNode, { frame }: {
        frame: Frame;
    }): void;
    visitCallExpression(node: CallExpressionNode, { frame }: {
        frame: Frame;
    }): void;
    visitMemberExpression(node: MemberExpressionNode, { frame }: {
        frame: Frame;
    }): void;
    visitBlock(node: BlockNode, { frame }: {
        frame: Frame;
    }): void;
    visitReturn(node: ReturnNode, { frame }: {
        frame: Frame;
    }): void;
    visitBreak(node: ASTNode, { frame }: {
        frame: Frame;
    }): void;
    visitContinue(node: ASTNode, { frame }: {
        frame: Frame;
    }): void;
    visitIfElse(node: IfElseNode, { frame }: {
        frame: Frame;
    }): void;
    visitWhile(node: WhileNode, { frame }: {
        frame: Frame;
    }): void;
    visitFor(node: ForNode, { frame }: {
        frame: Frame;
    }): void;
    visitVariableList(node: VariableListNode, args?: Record<string, any>): void;
    visitVariable(node: VariableNode, { frame }: {
        frame: Frame;
    }): void;
    visitBinaryOp(node: BinaryOpNode, { frame }: {
        frame: Frame;
    }): void;
    visitAssignmentExpression(node: BinaryOpNode, { frame }: {
        frame: Frame;
    }): void;
    visitIdentifier(node: IdentifierNode, { frame }: {
        frame: Frame;
    }): void;
    visitArray(node: ArrayNode, { frame }: {
        frame: Frame;
    }): void;
    visitObject(node: ObjectNode, { frame }: {
        frame: Frame;
    }): void;
    visitStructDef(node: StructDefNode, { frame }: {
        frame: Frame;
    }): void;
    visitString(node: StringNode, { frame }: {
        frame: Frame;
    }): void;
    visitNumber(node: NumberNode, { frame }: {
        frame: Frame;
    }): void;
}
//# sourceMappingURL=interpreter.d.ts.map