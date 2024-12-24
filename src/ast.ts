export interface ASTNode {
    type: string;
}

export interface SourceElementsNode extends ASTNode {
    type: 'SourceElements';
    sources: ASTNode[];
}

export interface BlockNode extends ASTNode {
    type: 'Block';
    body: ASTNode[];
}

export interface WhileNode extends ASTNode {
    type: 'While';
    expression: ASTNode;
    body: ASTNode;
}

export interface ForNode extends ASTNode {
    type: 'For';
    init?: ASTNode;
    condition?: ASTNode;
    update?: ASTNode;
    body: ASTNode
}

export interface FunctionDecNode extends ASTNode {
    type: 'FunctionDec';
    inbuilt: boolean;
    identifier: string;
    params?: ParametersListNode;
    body: BlockNode;
}

export interface ParametersListNode extends ASTNode {
    type: 'ParametersList';
    parameters: ASTNode[]
}

export interface ParameterNode extends ASTNode {
    type: 'Parameter';
    identifier: IdentifierNode;
    expression?: ASTNode;
    value?: any;
}

export interface ReturnNode extends ASTNode {
    type: 'Return';
    expression?: any;
}

export interface VariableListNode extends ASTNode {
    type: 'Let';
    variables: ASTNode[]
}

export interface VariableNode extends ASTNode {
    type: 'Variable';
    identifier: ASTNode;
    expression?: ASTNode;
    value?: any;
}

export interface ExpressionStatementNode extends ASTNode {
    type: 'ExpressionStatement';
    expression: ASTNode
}

export interface ExpressionNode extends ASTNode {
    type: 'Expression';
    expressions: ASTNode[];
}

export interface NumberNode extends ASTNode {
    type: 'Number';
    value: number;
}

export interface StringNode extends ASTNode {
    type: 'String';
    value: string;
}

export interface ArrayNode extends ASTNode {
    type: 'Array';
    elements: ASTNode[];
}

export interface ObjectNode extends ASTNode {
    type: 'Object';
    properties: PropertNode[];
}

export interface PropertNode extends ASTNode {
    type: 'Property';
    key: ASTNode;
    value: ASTNode;
}

export interface BinaryOpNode extends ASTNode {
    type: 'BinaryOp';
    operator: string;
    left: ASTNode;
    right: ASTNode;
}

export interface TertiaryExpressionNode extends ASTNode {
    type: 'TertiaryExpression';
    condition: ASTNode;
    consequent: ASTNode;
    alternate: ASTNode
}

export interface IfElseNode extends ASTNode {
    type: 'IfElse';
    condition: ASTNode;
    consequent: ASTNode;
    alternate?: ASTNode
}

export interface UnaryOpNode extends ASTNode {
    type: 'UnaryOp';
    operator: string;
    operand: ASTNode;
}

export interface MemberExpressionNode extends ASTNode {
    type: 'MemberExpression';
    object: ASTNode;
    property: ASTNode;
    computed: boolean;  // true for obj[expr], false for obj.id
}

export interface CallExpressionNode extends ASTNode {
    type: 'CallExpression';
    callee: ASTNode;
    arguments: ASTNode[];
}

export interface ArrowExpressionNode extends ASTNode {
    type: 'ArrowExpression';
    object: ASTNode;
    property: IdentifierNode;
}

export interface PostfixExpressionNode extends ASTNode {
    type: 'PostfixExpression';
    operator: string;
    argument: ASTNode;
    prefix: boolean;
}

export interface IdentifierNode extends ASTNode {
    type: 'Identifier';
    name: string;
}

export interface AssignmentNode extends ASTNode {
    type: 'Assignment';
    variable: IdentifierNode;
    value: ASTNode;
}