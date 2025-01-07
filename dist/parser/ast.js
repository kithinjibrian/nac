"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldNode = exports.StructNode = exports.AssignmentNode = exports.GenericTypeNode = exports.TypeNode = exports.TypeParameterNode = exports.IdentifierNode = exports.PostfixExpressionNode = exports.ArrowExpressionNode = exports.CallExpressionNode = exports.AwaitExpressionNode = exports.MemberExpressionNode = exports.UnaryOpNode = exports.IfElseNode = exports.TertiaryExpressionNode = exports.BinaryOpNode = exports.PropertyNode = exports.StructDefNode = exports.ObjectNode = exports.ArrayNode = exports.StringNode = exports.BooleanNode = exports.NumberNode = exports.ExpressionNode = exports.ExpressionStatementNode = exports.VariableNode = exports.VariableListNode = exports.ReturnNode = exports.ParameterNode = exports.ParametersListNode = exports.LambdaNode = exports.FunctionDecNode = exports.ContinuationNode = exports.ForNode = exports.WhileNode = exports.BlockNode = exports.SourceElementsNode = exports.ASTNodeBase = void 0;
class ASTNodeBase {
    accept(visitor, args) {
        var _a, _b;
        (_a = visitor.before_accept) === null || _a === void 0 ? void 0 : _a.call(visitor, this);
        const res = this._accept(visitor, args);
        (_b = visitor.after_accept) === null || _b === void 0 ? void 0 : _b.call(visitor, this);
        return res;
    }
}
exports.ASTNodeBase = ASTNodeBase;
class SourceElementsNode extends ASTNodeBase {
    constructor(sources) {
        super();
        this.sources = sources;
        this.type = 'SourceElements';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitSourceElements) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.SourceElementsNode = SourceElementsNode;
class BlockNode extends ASTNodeBase {
    constructor(body) {
        super();
        this.body = body;
        this.type = 'Block';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitBlock) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.BlockNode = BlockNode;
class WhileNode extends ASTNodeBase {
    constructor(expression, body) {
        super();
        this.expression = expression;
        this.body = body;
        this.type = 'While';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitWhile) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.WhileNode = WhileNode;
class ForNode extends ASTNodeBase {
    constructor(init, condition, update, body) {
        super();
        this.init = init;
        this.condition = condition;
        this.update = update;
        this.body = body;
        this.type = 'For';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitFor) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.ForNode = ForNode;
class ContinuationNode extends ASTNodeBase {
    constructor(params, body) {
        super();
        this.params = params;
        this.body = body;
        this.type = "Continuation";
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitContinuation) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.ContinuationNode = ContinuationNode;
class FunctionDecNode extends ASTNodeBase {
    constructor(identifier, params, body, inbuilt = false, is_async = false, type_parameters) {
        super();
        this.identifier = identifier;
        this.params = params;
        this.body = body;
        this.inbuilt = inbuilt;
        this.is_async = is_async;
        this.type_parameters = type_parameters;
        this.type = 'FunctionDec';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitFunctionDec) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.FunctionDecNode = FunctionDecNode;
class LambdaNode extends ASTNodeBase {
    constructor(params, body, is_async = false, type_parameters) {
        super();
        this.params = params;
        this.body = body;
        this.is_async = is_async;
        this.type_parameters = type_parameters;
        this.type = 'Lambda';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitLambda) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.LambdaNode = LambdaNode;
class ParametersListNode extends ASTNodeBase {
    constructor(parameters) {
        super();
        this.parameters = parameters;
        this.type = 'ParametersList';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitParametersList) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.ParametersListNode = ParametersListNode;
class ParameterNode extends ASTNodeBase {
    constructor(identifier, variadic, expression, value) {
        super();
        this.identifier = identifier;
        this.variadic = variadic;
        this.expression = expression;
        this.value = value;
        this.type = 'Parameter';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitParameter) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.ParameterNode = ParameterNode;
class ReturnNode extends ASTNodeBase {
    constructor(expression) {
        super();
        this.expression = expression;
        this.type = 'Return';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitReturn) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.ReturnNode = ReturnNode;
class VariableListNode extends ASTNodeBase {
    constructor(variables) {
        super();
        this.variables = variables;
        this.type = 'Let';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitVariableList) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.VariableListNode = VariableListNode;
class VariableNode extends ASTNodeBase {
    constructor(identifier, expression, value, data_type) {
        super();
        this.identifier = identifier;
        this.expression = expression;
        this.value = value;
        this.data_type = data_type;
        this.type = 'Variable';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitVariable) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.VariableNode = VariableNode;
class ExpressionStatementNode extends ASTNodeBase {
    constructor(expression) {
        super();
        this.expression = expression;
        this.type = 'ExpressionStatement';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitExpressionStatement) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.ExpressionStatementNode = ExpressionStatementNode;
class ExpressionNode extends ASTNodeBase {
    constructor(expressions) {
        super();
        this.expressions = expressions;
        this.type = 'Expression';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitExpression) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.ExpressionNode = ExpressionNode;
class NumberNode extends ASTNodeBase {
    constructor(value) {
        super();
        this.value = value;
        this.type = 'Number';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitNumber) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.NumberNode = NumberNode;
class BooleanNode extends ASTNodeBase {
    constructor(value) {
        super();
        this.value = value;
        this.type = 'Boolean';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitBoolean) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.BooleanNode = BooleanNode;
class StringNode extends ASTNodeBase {
    constructor(value) {
        super();
        this.value = value;
        this.type = 'String';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitString) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.StringNode = StringNode;
class ArrayNode extends ASTNodeBase {
    constructor(elements) {
        super();
        this.elements = elements;
        this.type = 'Array';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitArray) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.ArrayNode = ArrayNode;
class ObjectNode extends ASTNodeBase {
    constructor(properties) {
        super();
        this.properties = properties;
        this.type = 'Object';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitObject) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.ObjectNode = ObjectNode;
class StructDefNode extends ASTNodeBase {
    constructor(name, object) {
        super();
        this.name = name;
        this.object = object;
        this.type = 'StructDef';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitStructDef) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.StructDefNode = StructDefNode;
class PropertyNode extends ASTNodeBase {
    constructor(key, value) {
        super();
        this.key = key;
        this.value = value;
        this.type = 'Property';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitProperty) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.PropertyNode = PropertyNode;
class BinaryOpNode extends ASTNodeBase {
    constructor(operator, left, right) {
        super();
        this.operator = operator;
        this.left = left;
        this.right = right;
        this.type = 'BinaryExpression';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitBinaryOp) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.BinaryOpNode = BinaryOpNode;
class TertiaryExpressionNode extends ASTNodeBase {
    constructor(condition, consequent, alternate) {
        super();
        this.condition = condition;
        this.consequent = consequent;
        this.alternate = alternate;
        this.type = 'TertiaryExpression';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitTertiaryExpression) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.TertiaryExpressionNode = TertiaryExpressionNode;
class IfElseNode extends ASTNodeBase {
    constructor(condition, consequent, alternate) {
        super();
        this.condition = condition;
        this.consequent = consequent;
        this.alternate = alternate;
        this.type = 'IfElse';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitIfElse) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.IfElseNode = IfElseNode;
class UnaryOpNode extends ASTNodeBase {
    constructor(operator, operand) {
        super();
        this.operator = operator;
        this.operand = operand;
        this.type = 'UnaryOp';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitUnaryOp) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.UnaryOpNode = UnaryOpNode;
class MemberExpressionNode extends ASTNodeBase {
    constructor(object, property, computed) {
        super();
        this.object = object;
        this.property = property;
        this.computed = computed;
        this.type = 'MemberExpression';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitMemberExpression) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.MemberExpressionNode = MemberExpressionNode;
class AwaitExpressionNode extends ASTNodeBase {
    constructor(expression) {
        super();
        this.expression = expression;
        this.type = 'AwaitExpression';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitAwaitExpression) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.AwaitExpressionNode = AwaitExpressionNode;
class CallExpressionNode extends ASTNodeBase {
    constructor(callee, args) {
        super();
        this.callee = callee;
        this.args = args;
        this.type = 'CallExpression';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitCallExpression) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.CallExpressionNode = CallExpressionNode;
class ArrowExpressionNode extends ASTNodeBase {
    constructor(params, body) {
        super();
        this.params = params;
        this.body = body;
        this.type = 'ArrowExpression';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitArrowExpression) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.ArrowExpressionNode = ArrowExpressionNode;
class PostfixExpressionNode extends ASTNodeBase {
    constructor(operator, argument, prefix) {
        super();
        this.operator = operator;
        this.argument = argument;
        this.prefix = prefix;
        this.type = 'PostfixExpression';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitPostfixExpression) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.PostfixExpressionNode = PostfixExpressionNode;
class IdentifierNode extends ASTNodeBase {
    constructor(name, data_type) {
        super();
        this.name = name;
        this.data_type = data_type;
        this.type = 'Identifier';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitIdentifier) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.IdentifierNode = IdentifierNode;
class TypeParameterNode extends ASTNodeBase {
    constructor(name, constraints = []) {
        super();
        this.name = name;
        this.constraints = constraints;
        this.type = "TypeParameter";
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitTypeParameter) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.TypeParameterNode = TypeParameterNode;
class TypeNode extends ASTNodeBase {
    constructor(name, types) {
        super();
        this.name = name;
        this.types = types;
        this.type = "Type";
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitType) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.TypeNode = TypeNode;
class GenericTypeNode extends ASTNodeBase {
    constructor(type_parameters, base_type) {
        super();
        this.type_parameters = type_parameters;
        this.base_type = base_type;
        this.type = "GenericType";
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitGenericType) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.GenericTypeNode = GenericTypeNode;
class AssignmentNode extends ASTNodeBase {
    constructor(variable, value) {
        super();
        this.variable = variable;
        this.value = value;
        this.type = 'Assignment';
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitAssignment) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.AssignmentNode = AssignmentNode;
class StructNode extends ASTNodeBase {
    constructor(name, body, type_parameters) {
        super();
        this.name = name;
        this.body = body;
        this.type_parameters = type_parameters;
        this.type = "Struct";
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitStruct) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.StructNode = StructNode;
class FieldNode extends ASTNodeBase {
    constructor(field) {
        super();
        this.field = field;
        this.type = "Fields";
    }
    _accept(visitor, args) {
        var _a;
        return (_a = visitor.visitField) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
    }
}
exports.FieldNode = FieldNode;
