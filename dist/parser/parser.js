"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const ast_1 = require("./ast");
const token_1 = require("../lexer/token");
class Parser {
    constructor(tokens) {
        this.tokens = [];
        this.current = 0;
        this.tokens = tokens;
    }
    peek() {
        return this.tokens[this.current];
    }
    previous() {
        return this.tokens[this.current - 1];
    }
    is_at_end() {
        return this.peek() == undefined ||
            this.peek().type === token_1.TokenType.EOF;
    }
    advance() {
        if (!this.is_at_end())
            this.current++;
        return this.previous();
    }
    check(type) {
        if (this.is_at_end())
            return false;
        return this.peek().type === type;
    }
    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    error(message) {
        const token = this.peek();
        throw new Error(`${message} at line ${token.line}, column ${token.column}`);
    }
    parse() {
        return this.source_elements();
    }
    source_elements() {
        const sources = [];
        while (!this.is_at_end()) {
            sources.push(this.source_element());
        }
        return new ast_1.SourceElementsNode(sources);
    }
    source_element() {
        if (this.peek().type == token_1.TokenType.Fun) {
            return this.function_dec();
        }
        return this.statement();
    }
    function_dec() {
        // Expect function name
        if (!this.match(token_1.TokenType.Fun)) {
            this.error("Expected 'fun' keyword name");
        }
        if (!this.match(token_1.TokenType.Identifier)) {
            this.error("Expected function name");
        }
        const functionName = this.previous().value;
        let tp = undefined;
        if (this.match(token_1.TokenType.LT)) {
            tp = this.type_parameters();
            if (!this.match(token_1.TokenType.GT)) {
                this.error("Expected token '>'");
            }
        }
        // Expect opening parenthesis
        if (!this.match(token_1.TokenType.LeftParen)) {
            this.error("Expected '(' after function name");
        }
        // Parse parameters
        let parameters = this.parameters_list();
        // Expect closing parenthesis
        if (!this.match(token_1.TokenType.RightParen)) {
            this.error("Expected ')' after parameters");
        }
        return new ast_1.FunctionDecNode(functionName, parameters, this.block(), false, false, tp);
    }
    parameters_list() {
        if (this.peek().type == token_1.TokenType.RightParen) {
            return undefined;
        }
        const parameters = [];
        do {
            parameters.push(this.parameter());
        } while (this.match(token_1.TokenType.Comma));
        return new ast_1.ParametersListNode(parameters);
    }
    parameter() {
        let variadic = false;
        if (this.match(token_1.TokenType.Ellipsis)) {
            variadic = true;
        }
        const identifier = this.identifier();
        return new ast_1.ParameterNode(identifier, variadic);
    }
    /*
        statement ::= block | return_statement |
    */
    statement() {
        const iden = this.peek().type;
        switch (iden) {
            case token_1.TokenType.While:
                return this.while_statement();
            case token_1.TokenType.For:
                return this.for_statement();
            case token_1.TokenType.Return:
                return this.return_statement();
            case token_1.TokenType.Break:
                return this.break_statement();
            case token_1.TokenType.Continue:
                return this.continue_statement();
            case token_1.TokenType.LeftBrace:
                return this.block();
            case token_1.TokenType.If:
                return this.if_statement();
            case token_1.TokenType.Struct:
                return this.struct_statement();
            case token_1.TokenType.Let:
                {
                    const node = this.variable_statement();
                    if (!this.match(token_1.TokenType.SemiColon)) {
                        this.error("Expected ';'");
                    }
                    return node;
                }
        }
        return this.expression_statement();
    }
    /*
        block ::= { statement_list }
        statement_list ::= statement+
    */
    block() {
        const body = [];
        // Expect opening brace
        if (!this.match(token_1.TokenType.LeftBrace)) {
            this.error("Expected '{' before function body");
        }
        while (!this.check(token_1.TokenType.RightBrace) && !this.is_at_end()) {
            body.push(this.statement());
        }
        // Expect closing brace
        if (!this.match(token_1.TokenType.RightBrace)) {
            this.error("Expected '}' before function body");
        }
        return new ast_1.BlockNode(body);
    }
    return_statement() {
        if (!this.match(token_1.TokenType.Return)) {
            this.error("Expected 'return'");
        }
        if (this.match(token_1.TokenType.SemiColon)) {
            return new ast_1.ReturnNode();
        }
        const expression = this.expression();
        if (!this.match(token_1.TokenType.SemiColon)) {
            this.error("Expected ';' after return statement");
        }
        return new ast_1.ReturnNode(expression);
    }
    break_statement() {
        if (!this.match(token_1.TokenType.Break)) {
            this.error("Expected 'break'");
        }
        if (!this.match(token_1.TokenType.SemiColon)) {
            this.error("Expected ';' after break");
        }
        return {
            type: "Break",
            accept(visitor) {
                var _a;
                (_a = visitor.visitBreak) === null || _a === void 0 ? void 0 : _a.call(visitor, this);
            }
        };
    }
    continue_statement() {
        if (!this.match(token_1.TokenType.Continue)) {
            this.error("Expected 'continue'");
        }
        if (!this.match(token_1.TokenType.SemiColon)) {
            this.error("Expected ';' after continue");
        }
        return {
            type: "Continue",
            accept(visitor) {
                var _a;
                (_a = visitor.visitContinue) === null || _a === void 0 ? void 0 : _a.call(visitor, this);
            }
        };
    }
    variable_statement() {
        const variables = [];
        if (!this.match(token_1.TokenType.Let)) {
            this.error("Expected 'let'");
        }
        do {
            variables.push(this.variable());
        } while (this.match(token_1.TokenType.Comma));
        return new ast_1.VariableListNode(variables);
    }
    variable() {
        const identifier = this.identifier();
        let expression = undefined;
        if (this.match(token_1.TokenType.Equals)) {
            expression = this.assignment_expression();
        }
        return new ast_1.VariableNode(identifier, expression);
    }
    while_statement() {
        if (!this.match(token_1.TokenType.While)) {
            this.error("Expected keyword 'while'");
        }
        // Expect opening parenthesis
        if (!this.match(token_1.TokenType.LeftParen)) {
            this.error("Expected '(' after function name");
        }
        // Parse expression
        let expression = this.expression();
        // Expect closing parenthesis
        if (!this.match(token_1.TokenType.RightParen)) {
            this.error("Expected ')' after parameters");
        }
        const body = this.statement();
        return new ast_1.WhileNode(expression, body);
    }
    for_statement() {
        if (!this.match(token_1.TokenType.For)) {
            this.error("Expected keyword 'for'");
        }
        // Expect opening parenthesis
        if (!this.match(token_1.TokenType.LeftParen)) {
            this.error("Expected '(' after function name");
        }
        let init = undefined;
        if (!this.check(token_1.TokenType.SemiColon)) {
            init = this.expression();
        }
        if (!this.match(token_1.TokenType.SemiColon)) {
            this.error("Expected ';' after expression");
        }
        let condition = undefined;
        if (!this.check(token_1.TokenType.SemiColon)) {
            condition = this.expression();
        }
        if (!this.match(token_1.TokenType.SemiColon)) {
            this.error("Expected ';' after expression");
        }
        let update = undefined;
        if (!this.check(token_1.TokenType.SemiColon)) {
            update = this.expression();
        }
        // Expect closing parenthesis
        if (!this.match(token_1.TokenType.RightParen)) {
            this.error("Expected ')' after parameters");
        }
        const body = this.statement();
        return new ast_1.ForNode(init, condition, update, body);
    }
    if_statement() {
        if (!this.match(token_1.TokenType.If)) {
            this.error("Expected keyword 'if'");
        }
        // Expect opening parenthesis
        if (!this.match(token_1.TokenType.LeftParen)) {
            this.error("Expected '(' after function name");
        }
        // Parse condition
        let condition = this.expression();
        // Expect closing parenthesis
        if (!this.match(token_1.TokenType.RightParen)) {
            this.error("Expected ')' after parameters");
        }
        const consequent = this.statement();
        if (this.match(token_1.TokenType.Else)) {
            const alternate = this.statement();
            return new ast_1.IfElseNode(condition, consequent, alternate);
        }
        return new ast_1.IfElseNode(condition, consequent);
    }
    expression_statement() {
        const expression = this.expression();
        if (!this.match(token_1.TokenType.SemiColon)) {
            this.error("Expected ';' after expression");
        }
        return new ast_1.ExpressionStatementNode(expression);
    }
    expression() {
        const expr = this.assignment_expression();
        if (this.match(token_1.TokenType.Comma)) {
            const expressions = [expr];
            do {
                expressions.push(this.assignment_expression());
            } while (this.match(token_1.TokenType.Comma));
            return new ast_1.ExpressionNode(expressions);
        }
        return expr;
    }
    assignment_expression() {
        const left = this.conditional_expression();
        if (this.is_assignment_operator(this.peek().type)) {
            const operator = this.advance().value;
            const right = this.assignment_expression();
            if (!this.is_valid_assignment_target(left)) {
                this.error('Invalid assignment target');
            }
            return {
                type: 'AssignmentExpression',
                left,
                operator,
                right,
                accept(visitor, args) {
                    var _a;
                    (_a = visitor.visitAssignmentExpression) === null || _a === void 0 ? void 0 : _a.call(visitor, this, args);
                }
            };
        }
        return left;
    }
    is_assignment_operator(type) {
        return type === token_1.TokenType.Equals ||
            type === token_1.TokenType.PlusEquals ||
            type === token_1.TokenType.MinusEquals ||
            type === token_1.TokenType.MultiplyEquals ||
            type === token_1.TokenType.DivideEquals ||
            type === token_1.TokenType.ModuloEquals ||
            type === token_1.TokenType.SREquals ||
            type === token_1.TokenType.SlEquals ||
            type === token_1.TokenType.AndEquals ||
            type === token_1.TokenType.XorEquals ||
            type === token_1.TokenType.OrEquals;
    }
    is_valid_assignment_target(node) {
        switch (node.type) {
            case 'Identifier':
                return true;
            case 'MemberExpression':
                return true;
            default:
                return false;
        }
    }
    conditional_expression() {
        const condition = this.logical_or_expression();
        if (this.match(token_1.TokenType.QuestionMark)) {
            const consequent = this.expression();
            if (!this.match(token_1.TokenType.Colon)) {
                this.error("Expected ':' in conditional expression");
            }
            const alternate = this.conditional_expression();
            return {
                type: 'TertiaryExpression',
                condition,
                consequent,
                alternate,
                accept(visitor) {
                    var _a;
                    (_a = visitor.visitTertiaryExpression) === null || _a === void 0 ? void 0 : _a.call(visitor, this);
                }
            };
        }
        return condition;
    }
    logical_or_expression() {
        let expr = this.logical_and_expression();
        while (this.match(token_1.TokenType.Or)) {
            const operator = this.previous().value;
            const right = this.logical_and_expression();
            expr = new ast_1.BinaryOpNode(operator, expr, right);
        }
        return expr;
    }
    logical_and_expression() {
        let expr = this.bitwise_or_expression();
        while (this.match(token_1.TokenType.And)) {
            const operator = this.previous().value;
            const right = this.logical_and_expression();
            expr = new ast_1.BinaryOpNode(operator, expr, right);
        }
        return expr;
    }
    bitwise_or_expression() {
        let expr = this.bitwise_xor_expression();
        while (this.match(token_1.TokenType.Pipe)) {
            const operator = this.previous().value;
            const right = this.bitwise_xor_expression();
            expr = new ast_1.BinaryOpNode(operator, expr, right);
        }
        return expr;
    }
    bitwise_xor_expression() {
        let expr = this.bitwise_and_expression();
        while (this.match(token_1.TokenType.Caret)) {
            const operator = this.previous().value;
            const right = this.bitwise_and_expression();
            expr = new ast_1.BinaryOpNode(operator, expr, right);
        }
        return expr;
    }
    bitwise_and_expression() {
        let expr = this.equality_expression();
        while (this.match(token_1.TokenType.Ampersand)) {
            const operator = this.previous().value;
            const right = this.equality_expression();
            expr = new ast_1.BinaryOpNode(operator, expr, right);
        }
        return expr;
    }
    equality_expression() {
        let expr = this.relational_expression();
        if (this.is_equality_operator(this.peek().type)) {
            const operator = this.advance().value;
            const right = this.relational_expression();
            expr = new ast_1.BinaryOpNode(operator, expr, right);
        }
        return expr;
    }
    is_equality_operator(type) {
        return type === token_1.TokenType.IsEqual ||
            type === token_1.TokenType.IsNotEqual;
    }
    relational_expression() {
        let expr = this.shift_expression();
        if (this.is_relational_operator(this.peek().type)) {
            const operator = this.advance().value;
            const right = this.shift_expression();
            expr = new ast_1.BinaryOpNode(operator, expr, right);
        }
        return expr;
    }
    is_relational_operator(type) {
        return type === token_1.TokenType.LT ||
            type === token_1.TokenType.LTE ||
            type === token_1.TokenType.GT ||
            type === token_1.TokenType.GTE;
    }
    shift_expression() {
        let expr = this.additive_expression();
        if (this.is_shift_operator(this.peek().type)) {
            const operator = this.advance().value;
            const right = this.additive_expression();
            expr = new ast_1.BinaryOpNode(operator, expr, right);
        }
        return expr;
    }
    is_shift_operator(type) {
        return type === token_1.TokenType.SR ||
            type === token_1.TokenType.SL;
    }
    additive_expression() {
        let expr = this.multiplicative_expression();
        if (this.is_additive_operator(this.peek().type)) {
            const operator = this.advance().value;
            const right = this.multiplicative_expression();
            expr = new ast_1.BinaryOpNode(operator, expr, right);
        }
        return expr;
    }
    is_additive_operator(type) {
        return type === token_1.TokenType.Plus ||
            type === token_1.TokenType.Minus;
    }
    multiplicative_expression() {
        let expr = this.unary_expression();
        if (this.is_multiplicative_operator(this.peek().type)) {
            const operator = this.advance().value;
            const right = this.unary_expression();
            expr = new ast_1.BinaryOpNode(operator, expr, right);
        }
        return expr;
    }
    is_multiplicative_operator(type) {
        return type === token_1.TokenType.Multiply ||
            type === token_1.TokenType.Divide ||
            type === token_1.TokenType.Modulo;
    }
    unary_expression() {
        // if (this.match(TokenType.Increment, TokenType.Decrement)) {
        //     const operator = this.previous().value;
        //     const right = this.unary_expression();
        //     return {
        //         type: 'UnaryOp',
        //         operator,
        //         operand: right
        //     } as ASTNode;
        // }
        return this.postfix_expression();
    }
    postfix_expression() {
        let expr = this.primary_expression();
        while (true) {
            if (this.match(token_1.TokenType.LeftBracket)) {
                // Array access: expr[index]
                const index = this.expression();
                if (!this.match(token_1.TokenType.RightBracket)) {
                    this.error("Expected ']' after array index");
                }
                expr = new ast_1.MemberExpressionNode(expr, index, true);
            }
            else if (this.match(token_1.TokenType.LeftParen)) {
                // Function call: expr(args)
                const args = [];
                if (!this.check(token_1.TokenType.RightParen)) {
                    do {
                        args.push(this.assignment_expression());
                    } while (this.match(token_1.TokenType.Comma));
                }
                if (!this.match(token_1.TokenType.RightParen)) {
                    this.error("Expected ')' after function arguments");
                }
                expr = new ast_1.CallExpressionNode(expr, args);
            }
            else if (this.match(token_1.TokenType.Dot)) {
                // Member access: expr.id
                if (!this.match(token_1.TokenType.Identifier)) {
                    this.error("Expected identifier after '.'");
                }
                expr = new ast_1.MemberExpressionNode(expr, new ast_1.IdentifierNode(this.previous().value), false);
            }
            else if (this.match(token_1.TokenType.Arrow)) {
                // Arrow operator: expr->id
                if (!this.match(token_1.TokenType.Identifier)) {
                    this.error("Expected identifier after '->'");
                }
                expr = new ast_1.ArrowExpressionNode(expr, new ast_1.IdentifierNode(this.previous().value));
            }
            // else if (this.match(TokenType.Increment, TokenType.Decrement)) {
            //     // Postfix increment/decrement: expr++ or expr--
            //     expr = {
            //         type: 'PostfixExpression',
            //         operator: this.previous().value,
            //         argument: expr,
            //         prefix: false
            //     } as ASTNode;
            // }
            else {
                break;
            }
        }
        return expr;
    }
    primary_expression() {
        switch (this.peek().type) {
            case token_1.TokenType.Number:
                return this.number();
            case token_1.TokenType.String:
                return this.string();
            case token_1.TokenType.Identifier: {
                const iden = this.identifier();
                if (this.peek().type == token_1.TokenType.LeftBrace) {
                    const object = this.object();
                    return new ast_1.StructDefNode(iden.name, object);
                }
                return iden;
            }
            case token_1.TokenType.LeftParen:
                {
                    this.advance();
                    const expr = this.expression();
                    if (!this.match(token_1.TokenType.RightParen)) {
                        this.error("Expected ')' after expression.");
                    }
                    return expr;
                }
            case token_1.TokenType.LeftBracket:
                return this.array();
            case token_1.TokenType.LeftBrace:
                return this.object();
        }
        return this.error('Unknown');
    }
    number() {
        if (!this.match(token_1.TokenType.Number)) {
            this.error("Expected a number");
        }
        return new ast_1.NumberNode(+this.previous().value);
    }
    string() {
        if (!this.match(token_1.TokenType.String)) {
            this.error("Expected a string");
        }
        return new ast_1.StringNode(this.previous().value);
    }
    array() {
        const elements = [];
        if (!this.match(token_1.TokenType.LeftBracket)) {
            this.error("Expected a '['");
        }
        if (!this.check(token_1.TokenType.RightBracket)) {
            do {
                elements.push(this.conditional_expression());
            } while (this.match(token_1.TokenType.Comma));
        }
        if (!this.match(token_1.TokenType.RightBracket)) {
            this.error("Expected a ']'");
        }
        return new ast_1.ArrayNode(elements);
    }
    object() {
        const properties = [];
        if (!this.match(token_1.TokenType.LeftBrace)) {
            this.error("Expected a '{'");
        }
        if (!this.check(token_1.TokenType.RightBrace)) {
            do {
                properties.push(this.property_definition());
            } while (this.match(token_1.TokenType.Comma));
        }
        if (!this.match(token_1.TokenType.RightBrace)) {
            this.error("Expected a '}'");
        }
        return new ast_1.ObjectNode(properties);
    }
    property_definition() {
        let key;
        switch (this.peek().type) {
            case token_1.TokenType.String:
            case token_1.TokenType.Identifier: {
                key = this.peek().value;
                this.advance();
                break;
            }
            default:
                this.error("Unexpected property name");
        }
        if (!this.match(token_1.TokenType.Colon)) {
            this.error("Expected ':' after property name");
        }
        const value = this.assignment_expression();
        return new ast_1.PropertyNode(key, value);
    }
    identifier() {
        if (!this.match(token_1.TokenType.Identifier)) {
            this.error("Expected an identifer");
        }
        let data_type = undefined;
        const name = this.previous().value;
        if (this.match(token_1.TokenType.Colon)) {
            data_type = this.type();
        }
        return new ast_1.IdentifierNode(name, data_type);
    }
    type() {
        let type = null;
        if ((type = this.generic_type())) {
            return type;
        }
        else if ((type = this.array_type())) {
            return type;
        }
        else if ((type = this.map_type())) {
            return type;
        }
        else if ((type = this.function_type())) {
            return type;
        }
        else if ((type = this.struct_type())) {
            return type;
        }
        else if ((type = this.primitive())) {
            return type;
        }
        return {
            type: "",
            accept() { }
        };
    }
    generic_type() {
        if (!this.match(token_1.TokenType.LT)) {
            return null;
        }
        const tp = this.type_parameters();
        if (!this.match(token_1.TokenType.GT)) {
            this.error("Expected token '>'");
        }
        const bt = this.type();
        return new ast_1.GenericTypeNode(tp, bt);
    }
    type_parameters() {
        const params = [];
        do {
            if (!this.match(token_1.TokenType.Identifier)) {
                this.error("Expected an identifier.");
            }
            const name = this.previous().value;
            let constraints = [];
            if (this.match(token_1.TokenType.Colon)) {
                do {
                    if (!this.match(token_1.TokenType.Identifier)) {
                        this.error("Expected an identifier");
                    }
                    constraints.push(this.previous().value);
                } while (this.match(token_1.TokenType.Plus));
            }
            params.push(new ast_1.TypeParameterNode(name, constraints));
        } while (this.match(token_1.TokenType.Comma));
        return params;
    }
    primitive() {
        if (this.match(token_1.TokenType.Identifier)) {
            return new ast_1.TypeNode(this.previous().value);
        }
        return null;
    }
    array_type() {
        const value = this.peek().value;
        if (value === "array") {
            this.advance();
            if (!this.match(token_1.TokenType.LT)) {
                this.error("Expected <");
            }
            const type = this.type();
            if (!this.match(token_1.TokenType.GT)) {
                this.error("Expected >");
            }
            return new ast_1.TypeNode("array", [type]);
        }
        return null;
    }
    map_type() {
        const value = this.peek().value;
        if (value === "map") {
            this.advance();
            if (!this.match(token_1.TokenType.LT)) {
                this.error("Expected <");
            }
            const keyType = this.type();
            if (!this.match(token_1.TokenType.Comma)) {
                this.error("Expected ,");
            }
            const valueType = this.type();
            if (!this.match(token_1.TokenType.GT)) {
                this.error("Expected >");
            }
            return new ast_1.TypeNode("map", [keyType, valueType]);
        }
        return null;
    }
    function_type() {
        if (!this.match(token_1.TokenType.LeftParen)) {
            return null;
        }
        const params = this.parameters_list();
        if (!this.match(token_1.TokenType.RightParen)) {
            this.error("Expected ')'");
        }
        if (!this.match(token_1.TokenType.Arrow)) {
            this.error("Expected '->'");
        }
        const ret = this.type();
        return new ast_1.TypeNode("->", [params, ret]);
    }
    struct_type() {
        if (!this.match(token_1.TokenType.Struct)) {
            return null;
        }
        if (!this.match(token_1.TokenType.Identifier)) {
            this.error("Expected a name for struct");
        }
        const name = this.previous().value;
        const typeParams = [];
        if (this.match(token_1.TokenType.LT)) {
            do {
                const typeParam = this.type();
                if (!typeParam) {
                    this.error("Expected a valid type parameter");
                }
                typeParams.push(typeParam);
            } while (this.match(token_1.TokenType.Comma));
            if (!this.match(token_1.TokenType.GT)) {
                this.error("Expected token '>'");
            }
        }
        return new ast_1.TypeNode("struct", [name, ...typeParams]);
    }
    struct_statement() {
        if (!this.match(token_1.TokenType.Struct)) {
            this.error(`Expected token 'struct'`);
        }
        const name = this.peek().value;
        this.advance();
        let tp = undefined;
        if (this.match(token_1.TokenType.LT)) {
            tp = this.type_parameters();
            if (!this.match(token_1.TokenType.GT)) {
                this.error(`Expected token '>'`);
            }
        }
        if (!this.match(token_1.TokenType.LeftBrace)) {
            this.error(`Expected token '{'`);
        }
        let body = this.field_list();
        if (!this.match(token_1.TokenType.RightBrace)) {
            this.error(`Expected token '}'`);
        }
        if (this.match(token_1.TokenType.SemiColon)) { }
        return new ast_1.StructNode(name, body, tp);
    }
    field_list() {
        const fields = [];
        while (!this.check(token_1.TokenType.RightBrace)) {
            const identifier = this.identifier();
            fields.push(new ast_1.FieldNode(identifier));
            if (!this.match(token_1.TokenType.SemiColon)) {
                this.error(`Expected ';' after field declaration`);
            }
        }
        return fields;
    }
}
exports.Parser = Parser;
