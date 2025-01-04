export interface ASTVisitor {
    before_accept?(node: ASTNode): any;
    after_accept?(node: ASTNode): any;
    visitNumber?(node: NumberNode, args?: Record<string, any>): any;
    visitString?(node: StringNode, args?: Record<string, any>): any;
    visitSourceElements?(node: SourceElementsNode, args?: Record<string, any>): any;
    visitBlock?(node: BlockNode, args?: Record<string, any>): any;
    visitWhile?(node: WhileNode, args?: Record<string, any>): any;
    visitFor?(node: ForNode, args?: Record<string, any>): any;
    visitFunctionDec?(node: FunctionDecNode, args?: Record<string, any>): any;
    visitParametersList?(node: ParametersListNode, args?: Record<string, any>): any;
    visitParameter?(node: ParameterNode, args?: Record<string, any>): any;
    visitReturn?(node: ReturnNode, args?: Record<string, any>): any;
    visitBreak?(node: ASTNode, args?: Record<string, any>): any;
    visitContinue?(node: ASTNode, args?: Record<string, any>): any;
    visitVariableList?(node: VariableListNode, args?: Record<string, any>): any;
    visitVariable?(node: VariableNode, args?: Record<string, any>): any;
    visitExpressionStatement?(node: ExpressionStatementNode, args?: Record<string, any>): any;
    visitAssignmentExpression?(node: BinaryOpNode, args?: Record<string, any>): any;
    visitTertiaryExpression?(node: ASTNode, args?: Record<string, any>): any;
    visitExpression?(node: ExpressionNode, args?: Record<string, any>): any;
    visitArray?(node: ArrayNode, args?: Record<string, any>): any;
    visitObject?(node: ObjectNode, args?: Record<string, any>): any;
    visitStructDef?(node: StructDefNode, args?: Record<string, any>): any;
    visitProperty?(node: PropertyNode, args?: Record<string, any>): any;
    visitBinaryOp?(node: BinaryOpNode, args?: Record<string, any>): any;
    visitTertiaryExpression?(node: TertiaryExpressionNode, args?: Record<string, any>): any;
    visitIfElse?(node: IfElseNode, args?: Record<string, any>): any;
    visitUnaryOp?(node: UnaryOpNode, args?: Record<string, any>): any;
    visitMemberExpression?(node: MemberExpressionNode, args?: Record<string, any>): any;
    visitCallExpression?(node: CallExpressionNode, args?: Record<string, any>): any;
    visitArrowExpression?(node: ArrowExpressionNode, args?: Record<string, any>): any;
    visitPostfixExpression?(node: PostfixExpressionNode, args?: Record<string, any>): any;
    visitIdentifier?(node: IdentifierNode, args?: Record<string, any>): any;
    visitType?(node: TypeNode, args?: Record<string, any>): any;
    visitAssignment?(node: AssignmentNode, args?: Record<string, any>): any;
    visitTypeParameter?(node: TypeParameterNode, args?: Record<string, any>): any;
    visitGenericType?(node: GenericTypeNode, args?: Record<string, any>): any;
    visitStruct?(node: StructNode, args?: Record<string, any>): any;
    visitField?(node: FieldNode, args?: Record<string, any>): any;
}


export interface ASTNode {
    type: string;
    accept(visitor: ASTVisitor, args?: Record<string, any>): void;
}

export abstract class ASTNodeBase implements ASTNode {
    abstract type: string;

    accept(visitor: ASTVisitor, args?: Record<string, any>) {
        visitor.before_accept?.(this);
        const res = this._accept(visitor, args);
        visitor.after_accept?.(this);

        return res;
    }

    abstract _accept(visitor: ASTVisitor, args?: Record<string, any>): void;
}

export class SourceElementsNode extends ASTNodeBase {
    type = 'SourceElements';

    constructor(public sources: ASTNode[]) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitSourceElements?.(this, args);
    }
}

export class BlockNode extends ASTNodeBase {
    type = 'Block';

    constructor(public body: ASTNode[]) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitBlock?.(this, args);
    }
}

export class WhileNode extends ASTNodeBase {
    type = 'While';

    constructor(public expression: ASTNode, public body: ASTNode) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitWhile?.(this, args);
    }
}

export class ForNode extends ASTNodeBase {
    type = 'For';

    constructor(
        public init: ASTNode | undefined,
        public condition: ASTNode | undefined,
        public update: ASTNode | undefined,
        public body: ASTNode
    ) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitFor?.(this, args);
    }
}

export class FunctionDecNode extends ASTNodeBase {
    type = 'FunctionDec';

    constructor(
        public identifier: string,
        public params: ParametersListNode | undefined,
        public body: BlockNode,
        public inbuilt: boolean = false,
        public is_async: boolean = false,
        public type_parameters?: TypeParameterNode[]
    ) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitFunctionDec?.(this, args);
    }
}

export class ParametersListNode extends ASTNodeBase {
    type = 'ParametersList';

    constructor(public parameters: ParameterNode[]) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitParametersList?.(this, args);
    }
}

export class ParameterNode extends ASTNodeBase {
    type = 'Parameter';

    constructor(
        public identifier: IdentifierNode,
        public variadic: boolean,
        public expression?: ASTNode,
        public value?: any
    ) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitParameter?.(this, args);
    }
}

export class ReturnNode extends ASTNodeBase {
    type = 'Return';

    constructor(public expression?: ASTNode) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitReturn?.(this, args);
    }
}

export class VariableListNode extends ASTNodeBase {
    type = 'Let';

    constructor(public variables: VariableNode[]) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitVariableList?.(this, args);
    }
}

export class VariableNode extends ASTNodeBase {
    type = 'Variable';

    constructor(
        public identifier: IdentifierNode,
        public expression?: ASTNode,
        public value?: any,
        public data_type?: any
    ) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitVariable?.(this, args);
    }
}

export class ExpressionStatementNode extends ASTNodeBase {
    type = 'ExpressionStatement';

    constructor(public expression: ASTNode) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitExpressionStatement?.(this, args);
    }
}

export class ExpressionNode extends ASTNodeBase {
    type = 'Expression';

    constructor(public expressions: ASTNode[]) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitExpression?.(this, args);
    }
}

export class NumberNode extends ASTNodeBase {
    type = 'Number';

    constructor(public value: number) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitNumber?.(this, args);
    }
}

export class StringNode extends ASTNodeBase {
    type = 'String';

    constructor(public value: string) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitString?.(this, args);
    }
}

export class ArrayNode extends ASTNodeBase {
    type = 'Array';

    constructor(public elements: ASTNode[]) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitArray?.(this, args);
    }
}

export class ObjectNode extends ASTNodeBase {
    type = 'Object';

    constructor(public properties: PropertyNode[]) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitObject?.(this, args);
    }
}

export class StructDefNode extends ASTNodeBase {
    type = 'StructDef';

    constructor(
        public name: string,
        public object: ObjectNode
    ) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitStructDef?.(this, args);
    }
}

export class PropertyNode extends ASTNodeBase {
    type = 'Property';

    constructor(public key: string, public value: ASTNode) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitProperty?.(this, args);
    }
}

export class BinaryOpNode extends ASTNodeBase {
    type = 'BinaryExpression';

    constructor(
        public operator: string,
        public left: ASTNode,
        public right: ASTNode
    ) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitBinaryOp?.(this, args);
    }
}

export class TertiaryExpressionNode extends ASTNodeBase {
    type = 'TertiaryExpression';

    constructor(
        public condition: ASTNode,
        public consequent: ASTNode,
        public alternate: ASTNode
    ) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitTertiaryExpression?.(this, args);
    }
}

export class IfElseNode extends ASTNodeBase {
    type = 'IfElse';

    constructor(
        public condition: ASTNode,
        public consequent: ASTNode,
        public alternate?: ASTNode
    ) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitIfElse?.(this, args);
    }
}

export class UnaryOpNode extends ASTNodeBase {
    type = 'UnaryOp';

    constructor(public operator: string, public operand: ASTNode) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitUnaryOp?.(this, args);
    }
}

export class MemberExpressionNode extends ASTNodeBase {
    type = 'MemberExpression';

    constructor(
        public object: ASTNode,
        public property: ASTNode,
        public computed: boolean
    ) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitMemberExpression?.(this, args);
    }
}

export class CallExpressionNode extends ASTNodeBase {
    type = 'CallExpression';

    constructor(public callee: ASTNode, public args: ASTNode[]) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitCallExpression?.(this, args);
    }
}

export class ArrowExpressionNode extends ASTNodeBase {
    type = 'ArrowExpression';

    constructor(public params: ASTNode, public body: ASTNode) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitArrowExpression?.(this, args);
    }
}

export class PostfixExpressionNode extends ASTNodeBase {
    type = 'PostfixExpression';

    constructor(public operator: string, public argument: ASTNode, public prefix: boolean) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitPostfixExpression?.(this, args);
    }
}

export class IdentifierNode extends ASTNodeBase {
    type = 'Identifier';

    constructor(public name: string, public data_type?: ASTNode) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitIdentifier?.(this, args);
    }
}

export class TypeParameterNode extends ASTNodeBase {
    type = "TypeParameter";

    constructor(
        public name: string,
        public constraints: string[] = []
    ) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitTypeParameter?.(this, args);
    }
}

export class TypeNode extends ASTNodeBase {
    type = "Type";

    constructor(
        public name: string,
        public types?: any[]
    ) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitType?.(this, args);
    }
}

export class GenericTypeNode extends ASTNodeBase {
    type = "GenericType";

    constructor(
        public type_parameters: TypeParameterNode[],
        public base_type: ASTNode
    ) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitGenericType?.(this, args);
    }
}

export class AssignmentNode extends ASTNodeBase {
    type = 'Assignment';

    constructor(public variable: IdentifierNode, public value: ASTNode) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitAssignment?.(this, args);
    }
}

export class StructNode extends ASTNodeBase {
    type = "Struct";

    constructor(
        public name: string,
        public body: FieldNode[],
        public type_parameters?: TypeParameterNode[]

    ) {
        super();
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitStruct?.(this, args);
    }
}

export class FieldNode extends ASTNodeBase {
    type = "Fields"

    constructor(
        public field: IdentifierNode
    ) {
        super()
    }

    _accept(visitor: ASTVisitor, args?: Record<string, any>): void {
        return visitor.visitField?.(this, args);
    }
}
