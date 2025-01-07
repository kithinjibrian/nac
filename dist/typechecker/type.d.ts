import { ArrayNode, ASTNode, ASTVisitor, AwaitExpressionNode, BinaryOpNode, BlockNode, CallExpressionNode, ExpressionStatementNode, FieldNode, FunctionDecNode, GenericTypeNode, IdentifierNode, IfElseNode, MemberExpressionNode, NumberNode, ObjectNode, ParameterNode, ParametersListNode, ReturnNode, SourceElementsNode, StringNode, StructDefNode, StructNode, TypeNode, TypeParameterNode, VariableListNode, VariableNode } from "../parser/ast";
import { Builtin } from "../phases/phases";
import { Frame } from "../dsa/symtab";
import { HM } from "./hm";
export interface TypeClass {
    name: string;
    methods: string[];
}
export type Types = {
    tag: "TVar";
    tvar: string;
    constraints: TypeClass[];
} | {
    tag: "TCon";
    tcon: {
        name: string;
        types: Types[];
        constraints: TypeClass[];
    };
} | {
    tag: "TRec";
    trec: {
        name: string;
        types: Record<string, Types>;
        constraints: TypeClass[];
    };
};
export declare const numericTypeClass: TypeClass;
export declare const stringTypeClass: TypeClass;
export declare const ordTypeClass: TypeClass;
export declare const eqTypeClass: TypeClass;
export declare const showTypeClass: TypeClass;
export declare class TypeChecker implements ASTVisitor {
    opts: Record<string, any>;
    primitives: string[];
    hm: HM;
    global: Frame;
    subst: Map<any, any>;
    constructor(opts?: Record<string, any>, primitives?: string[]);
    run(ast: ASTNode, builtin: Record<string, Builtin>): ASTNode;
    _run(ast: ASTNode, builtin: Record<string, Builtin>): any;
    proc_builtin({ node }: {
        node: Builtin;
    }): any;
    enter({ frame }: {
        frame: Frame;
    }): void;
    addTypeClassConstraint(type: Types, typeClass: TypeClass): void;
    checkTypeClassConstraints(type: Types, requiredClass: TypeClass, frame: Frame): boolean;
    private typeToString;
    before_accept(node: ASTNode): void;
    visitSourceElements(node: SourceElementsNode, args?: Record<string, any>): Types[];
    visitExpressionStatement(node: ExpressionStatementNode, args?: Record<string, any>): any;
    visitFunctionDec(node: FunctionDecNode, { frame }: {
        frame: Frame;
    }): Types;
    visitParametersList(node: ParametersListNode, args?: Record<string, any>): Types[];
    visitParameter(node: ParameterNode, { frame }: {
        frame: Frame;
    }): Types;
    visitBlock(node: BlockNode, { frame }: {
        frame: Frame;
    }): Types[];
    visitReturn(node: ReturnNode, { frame }: {
        frame: Frame;
    }): Types;
    visitIfElse(node: IfElseNode, args?: Record<string, any>): Types | void;
    visitVariableList(node: VariableListNode, args?: Record<string, any>): Types | void;
    visitVariable(node: VariableNode, { frame }: {
        frame: Frame;
    }): Types | void;
    visitAssignmentExpression(node: BinaryOpNode, { frame }: {
        frame: Frame;
    }): void;
    visitBinaryOp(node: BinaryOpNode, { frame }: {
        frame: Frame;
    }): Types;
    visitAwaitExpression(node: AwaitExpressionNode, args?: Record<string, any>): any;
    visitCallExpression(node: CallExpressionNode, args?: Record<string, any>): Types;
    visitMemberExpression(node: MemberExpressionNode, args?: Record<string, any>): Types | undefined;
    visitIdentifier(node: IdentifierNode, { frame }: {
        frame: Frame;
    }): any;
    visitGenericType(node: GenericTypeNode, { frame }: {
        frame: Frame;
    }): Types | void;
    visitTypeParameter(node: TypeParameterNode, { frame }: {
        frame: Frame;
    }): Types;
    visitType(node: TypeNode, { frame }: {
        frame: Frame;
    }): Types | void;
    visitArray(node: ArrayNode, args?: Record<string, any>): Types;
    visitObject(node: ObjectNode, args?: Record<string, any>): Types;
    visitStructDef(node: StructDefNode, args?: Record<string, any>): {
        tag: "TRec";
        trec: {
            name: string;
            types: Record<string, Types>;
            constraints: TypeClass[];
        };
    } | undefined;
    visitStruct(node: StructNode, { frame }: {
        frame: Frame;
    }): void;
    visitField(node: FieldNode, args?: Record<string, any>): {
        magic: string;
        name: string;
        type: any;
    };
    visitNumber(node: NumberNode, { frame }: {
        frame: Frame;
    }): Types;
    visitString(node: StringNode, { frame }: {
        frame: Frame;
    }): Types;
    exit(): void;
}
//# sourceMappingURL=type.d.ts.map