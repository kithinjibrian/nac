import {
    ASTNode,
    ForNode,
    ArrayNode,
    BlockNode,
    WhileNode,
    IfElseNode,
    NumberNode,
    ObjectNode,
    ReturnNode,
    StringNode,
    PropertyNode,
    VariableNode,
    ParameterNode,
    IdentifierNode,
    FunctionDecNode,
    VariableListNode,
    ParametersListNode,
    SourceElementsNode,
    ExpressionStatementNode,
    ExpressionNode,
    BinaryOpNode,
    MemberExpressionNode,
    CallExpressionNode,
    ArrowExpressionNode,
    TypeNode,
    TypeParameterNode,
    GenericTypeNode,
    StructNode,
    FieldNode,
    StructDefNode,
    AwaitExpressionNode,
    LambdaNode,
    BooleanNode,
    EnumNode,
    EnumVariantNode,
    EnumVariantValueNode,
    StructVariantNode,
    TupleVariantNode,
    ConstantVariantNode,
} from "./ast";

import { Token } from "../lexer/lexer";
import { TokenType } from "../lexer/token";

export class Parser {
    private tokens: Token[] = [];
    private current: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens.filter(token => token.type !== TokenType.Newline);
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private is_at_end(): boolean {
        return this.peek() == undefined ||
            this.peek().type === TokenType.EOF;
    }

    private advance(): Token {
        if (!this.is_at_end()) this.current++;
        return this.previous();
    }

    private check(type: TokenType): boolean {
        if (this.is_at_end()) return false;
        return this.peek().type === type;
    }

    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    private error(message: string): never {
        const token = this.peek();
        throw new Error(`${message} at line ${token.line}, column ${token.column}`);
    }

    public parse(): ASTNode {
        return this.source_elements();
    }

    private source_elements(): SourceElementsNode {
        const sources: ASTNode[] = [];

        while (!this.is_at_end()) {
            sources.push(this.source_element());
        }

        return new SourceElementsNode(sources);
    }

    private source_element(): ASTNode {
        if (this.peek().type == TokenType.Fun) {
            return this.function_dec()
        } else if (this.peek().type == TokenType.Async) {
            return this.async_function_dec();
        }

        return this.statement();
    }

    private function_dec(): FunctionDecNode {
        // Expect function name
        if (!this.match(TokenType.Fun)) {
            this.error("Expected 'fun' keyword name");
        }

        if (!this.match(TokenType.Identifier)) {
            this.error("Expected function name");
        }

        const functionName = this.previous().value;
        let tp: TypeParameterNode[] | undefined = undefined;

        if (this.match(TokenType.LT)) {
            tp = this.type_parameters();

            if (!this.match(TokenType.GT)) {
                this.error("Expected token '>'")
            }
        }

        // Expect opening parenthesis
        if (!this.match(TokenType.LeftParen)) {
            this.error("Expected '(' after function name");
        }

        // Parse parameters
        let parameters = this.parameters_list();

        // Expect closing parenthesis
        if (!this.match(TokenType.RightParen)) {
            this.error("Expected ')' after parameters");
        }

        let rt: ASTNode | undefined = undefined;

        if (this.match(TokenType.Colon)) {
            rt = this.type();
        }

        return new FunctionDecNode(
            functionName,
            parameters,
            this.block(),
            false,
            false,
            tp,
            rt
        );
    }

    private async_function_dec() {
        if (!this.match(TokenType.Async)) {
            this.error("Expected 'async' token");
        }

        const fun = this.function_dec();
        fun.is_async = true;

        return fun;
    }

    private lambda_function() {
        // Expect function name
        if (!this.match(TokenType.Fun)) {
            this.error("Expected 'fun' keyword name");
        }

        let tp: TypeParameterNode[] | undefined = undefined;

        if (this.match(TokenType.LT)) {
            tp = this.type_parameters();

            if (!this.match(TokenType.GT)) {
                this.error("Expected token '>'")
            }
        }

        // Expect opening parenthesis
        if (!this.match(TokenType.LeftParen)) {
            this.error("Expected '(' after function name");
        }

        // Parse parameters
        let parameters = this.parameters_list();

        // Expect closing parenthesis
        if (!this.match(TokenType.RightParen)) {
            this.error("Expected ')' after parameters");
        }

        let rt: ASTNode | undefined = undefined;

        if (this.match(TokenType.Colon)) {
            rt = this.type();
        }

        // let body = undefined;
        // if (this.peek().type == TokenType.LeftBrace) {
        //     body = ;
        // } else if (this.match(TokenType.Arrow)) {
        //     body = this.expression()
        // }

        return new LambdaNode(
            parameters,
            this.block(),
            false,
            tp,
            rt
        );
    }

    private parameters_list(): ParametersListNode | undefined {

        if (this.peek().type == TokenType.RightParen) {
            return undefined;
        }

        const parameters = [];

        do {
            parameters.push(this.parameter());
        } while (this.match(TokenType.Comma));

        return new ParametersListNode(parameters);
    }

    private parameter(): ParameterNode {
        let variadic = false;

        if (this.match(TokenType.Ellipsis)) {
            variadic = true;
        }

        const identifier = this.identifier();

        return new ParameterNode(identifier, variadic);
    }

    /*
        statement ::= block | return_statement | 
    */
    private statement(): ASTNode {
        const iden = this.peek().type;

        switch (iden) {
            case TokenType.While:
                return this.while_statement();
            case TokenType.For:
                return this.for_statement();
            case TokenType.Return:
                return this.return_statement();
            case TokenType.Break:
                return this.break_statement();
            case TokenType.Continue:
                return this.continue_statement();
            case TokenType.LeftBrace:
                return this.block();
            case TokenType.If:
                return this.if_statement();
            case TokenType.Struct:
                return this.struct_statement();
            case TokenType.Enum:
                return this.enum_statement();
            case TokenType.Let:
                {
                    const node = this.variable_statement();
                    if (!this.match(TokenType.SemiColon)) {
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
    private block(): BlockNode {
        const body: ASTNode[] = [];

        // Expect opening brace
        if (!this.match(TokenType.LeftBrace)) {
            this.error("Expected '{' before function body");
        }

        while (!this.check(TokenType.RightBrace) && !this.is_at_end()) {
            body.push(this.statement());
        }

        // Expect closing brace
        if (!this.match(TokenType.RightBrace)) {
            this.error("Expected '}' before function body");
        }

        return new BlockNode(body);
    }

    private return_statement(): ReturnNode {
        if (!this.match(TokenType.Return)) {
            this.error("Expected 'return'");
        }

        if (this.match(TokenType.SemiColon)) {
            return new ReturnNode();
        }

        const expression = this.expression();

        if (!this.match(TokenType.SemiColon)) {
            this.error("Expected ';' after return statement");
        }

        return new ReturnNode(expression);
    }

    private break_statement(): ASTNode {
        if (!this.match(TokenType.Break)) {
            this.error("Expected 'break'");
        }

        if (!this.match(TokenType.SemiColon)) {
            this.error("Expected ';' after break");
        }

        return {
            type: "Break",
            accept(visitor) {
                visitor.visitBreak?.(this);
            }
        }
    }

    private continue_statement(): ASTNode {
        if (!this.match(TokenType.Continue)) {
            this.error("Expected 'continue'");
        }

        if (!this.match(TokenType.SemiColon)) {
            this.error("Expected ';' after continue");
        }

        return {
            type: "Continue",
            accept(visitor) {
                visitor.visitContinue?.(this);
            }
        }
    }

    private variable_statement(): VariableListNode {
        const variables: VariableNode[] = [];

        if (!this.match(TokenType.Let)) {
            this.error("Expected 'let'");
        }

        do {
            variables.push(this.variable());
        } while (this.match(TokenType.Comma))

        return new VariableListNode(variables);
    }

    private variable(): VariableNode {
        const identifier = this.identifier();
        let expression = undefined;

        if (this.match(TokenType.Equals)) {
            expression = this.assignment_expression();
        }

        return new VariableNode(identifier, expression);
    }

    private while_statement(): WhileNode {
        if (!this.match(TokenType.While)) {
            this.error("Expected keyword 'while'")
        }


        // Expect opening parenthesis
        if (!this.match(TokenType.LeftParen)) {
            this.error("Expected '(' after function name");
        }

        // Parse expression
        let expression = this.expression()

        // Expect closing parenthesis
        if (!this.match(TokenType.RightParen)) {
            this.error("Expected ')' after parameters");
        }


        const body = this.statement();

        return new WhileNode(expression, body);
    }

    private for_statement(): ForNode {
        if (!this.match(TokenType.For)) {
            this.error("Expected keyword 'for'")
        }

        // Expect opening parenthesis
        if (!this.match(TokenType.LeftParen)) {
            this.error("Expected '(' after function name");
        }

        let init: ASTNode | undefined = undefined;
        if (!this.check(TokenType.SemiColon)) {
            init = this.expression();
        }

        if (!this.match(TokenType.SemiColon)) {
            this.error("Expected ';' after expression");
        }

        let condition: ASTNode | undefined = undefined;
        if (!this.check(TokenType.SemiColon)) {
            condition = this.expression();
        }

        if (!this.match(TokenType.SemiColon)) {
            this.error("Expected ';' after expression");
        }

        let update: ASTNode | undefined = undefined;
        if (!this.check(TokenType.SemiColon)) {
            update = this.expression();
        }

        // Expect closing parenthesis
        if (!this.match(TokenType.RightParen)) {
            this.error("Expected ')' after parameters");
        }

        const body = this.statement();

        return new ForNode(init, condition, update, body);
    }

    private if_statement(): IfElseNode {
        if (!this.match(TokenType.If)) {
            this.error("Expected keyword 'if'")
        }

        // Expect opening parenthesis
        if (!this.match(TokenType.LeftParen)) {
            this.error("Expected '(' after function name");
        }

        // Parse condition
        let condition = this.expression()

        // Expect closing parenthesis
        if (!this.match(TokenType.RightParen)) {
            this.error("Expected ')' after parameters");
        }

        const consequent = this.statement();

        if (this.match(TokenType.Else)) {
            const alternate = this.statement();

            return new IfElseNode(condition, consequent, alternate);
        }

        return new IfElseNode(condition, consequent);
    }

    private expression_statement(): ExpressionStatementNode {
        const expression = this.expression();

        if (!this.match(TokenType.SemiColon)) {
            this.error("Expected ';' after expression");
        }

        return new ExpressionStatementNode(expression);
    }

    private expression(): ASTNode {
        const expr = this.assignment_expression();

        if (this.match(TokenType.Comma)) {
            const expressions = [expr];

            do {
                expressions.push(this.assignment_expression());
            } while (this.match(TokenType.Comma));

            return new ExpressionNode(expressions);
        }

        return expr;
    }

    private assignment_expression(): ASTNode {
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
                    visitor.visitAssignmentExpression?.(this as BinaryOpNode, args)
                }
            } as ASTNode;

        }
        return left;
    }

    private is_assignment_operator(type: TokenType): boolean {
        return type === TokenType.Equals ||
            type === TokenType.PlusEquals ||
            type === TokenType.MinusEquals ||
            type === TokenType.MultiplyEquals ||
            type === TokenType.DivideEquals ||
            type === TokenType.ModuloEquals ||
            type === TokenType.SREquals ||
            type === TokenType.SlEquals ||
            type === TokenType.AndEquals ||
            type === TokenType.XorEquals ||
            type === TokenType.OrEquals
    }

    private is_valid_assignment_target(node: ASTNode): boolean {
        switch (node.type) {
            case 'Identifier':
                return true;
            case 'MemberExpression':
                return true;
            default:
                return false;
        }
    }

    private conditional_expression(): ASTNode {
        const condition = this.logical_or_expression()

        if (this.match(TokenType.QuestionMark)) {
            const consequent = this.expression();

            if (!this.match(TokenType.Colon)) {
                this.error("Expected ':' in conditional expression");
            }

            const alternate = this.conditional_expression();

            return {
                type: 'TertiaryExpression',
                condition,
                consequent,
                alternate,
                accept(visitor) {
                    visitor.visitTertiaryExpression?.(this)
                }
            } as ASTNode;
        }

        return condition;
    }

    private logical_or_expression(): ASTNode {
        let expr = this.logical_and_expression();

        while (this.match(TokenType.Or)) {
            const operator = this.previous().value;
            const right = this.logical_and_expression();
            expr = new BinaryOpNode(operator, expr, right);
        }

        return expr;
    }

    private logical_and_expression(): ASTNode {
        let expr = this.bitwise_or_expression();

        while (this.match(TokenType.And)) {
            const operator = this.previous().value;
            const right = this.logical_and_expression();
            expr = new BinaryOpNode(operator, expr, right);
        }

        return expr;
    }

    private bitwise_or_expression(): ASTNode {
        let expr = this.bitwise_xor_expression();

        while (this.match(TokenType.Pipe)) {
            const operator = this.previous().value;
            const right = this.bitwise_xor_expression();
            expr = new BinaryOpNode(operator, expr, right);
        }

        return expr;
    }

    private bitwise_xor_expression(): ASTNode {
        let expr = this.bitwise_and_expression();

        while (this.match(TokenType.Caret)) {
            const operator = this.previous().value;
            const right = this.bitwise_and_expression();
            expr = new BinaryOpNode(operator, expr, right);
        }

        return expr;
    }

    private bitwise_and_expression(): ASTNode {
        let expr = this.equality_expression();

        while (this.match(TokenType.Ampersand)) {
            const operator = this.previous().value;
            const right = this.equality_expression();
            expr = new BinaryOpNode(operator, expr, right);
        }

        return expr;
    }

    private equality_expression(): ASTNode {
        let expr = this.relational_expression();

        if (this.is_equality_operator(this.peek().type)) {
            const operator = this.advance().value;
            const right = this.relational_expression();

            expr = new BinaryOpNode(operator, expr, right);

        }

        return expr;
    }

    private is_equality_operator(type: TokenType): boolean {
        return type === TokenType.IsEqual ||
            type === TokenType.IsNotEqual
    }

    private relational_expression(): ASTNode {
        let expr = this.shift_expression();

        if (this.is_relational_operator(this.peek().type)) {
            const operator = this.advance().value;
            const right = this.shift_expression();

            expr = new BinaryOpNode(operator, expr, right);
        }

        return expr;
    }

    private is_relational_operator(type: TokenType): boolean {
        return type === TokenType.LT ||
            type === TokenType.LTE ||
            type === TokenType.GT ||
            type === TokenType.GTE
    }

    private shift_expression(): ASTNode {
        let expr = this.additive_expression();

        if (this.is_shift_operator(this.peek().type)) {
            const operator = this.advance().value;
            const right = this.additive_expression();

            expr = new BinaryOpNode(operator, expr, right);

        }

        return expr;
    }

    private is_shift_operator(type: TokenType): boolean {
        return type === TokenType.SR ||
            type === TokenType.SL
    }

    private additive_expression(): ASTNode {
        let expr = this.multiplicative_expression();

        if (this.is_additive_operator(this.peek().type)) {
            const operator = this.advance().value;
            const right = this.multiplicative_expression();

            expr = new BinaryOpNode(operator, expr, right);

        }

        return expr;
    }

    private is_additive_operator(type: TokenType): boolean {
        return type === TokenType.Plus ||
            type === TokenType.Minus
    }

    private multiplicative_expression(): ASTNode {
        let expr = this.unary_expression();

        if (this.is_multiplicative_operator(this.peek().type)) {
            const operator = this.advance().value;
            const right = this.unary_expression();

            expr = new BinaryOpNode(operator, expr, right);

        }

        return expr;
    }

    private is_multiplicative_operator(type: TokenType): boolean {
        return type === TokenType.Multiply ||
            type === TokenType.Divide ||
            type === TokenType.Modulo
    }

    private unary_expression(): ASTNode {
        return this.postfix_expression();
    }

    private postfix_expression(): ASTNode {

        let expr: ASTNode;
        if (this.match(TokenType.Await)) {
            const awaitedExpr = this.postfix_expression();
            return new AwaitExpressionNode(awaitedExpr);
        } else {
            expr = this.primary_expression();
        }

        while (true) {
            if (this.match(TokenType.LeftBracket)) {
                // Array access: expr[index]
                const index = this.expression();
                if (!this.match(TokenType.RightBracket)) {
                    this.error("Expected ']' after array index");
                }
                expr = new MemberExpressionNode(expr, index, true);
            }
            else if (this.match(TokenType.LeftParen)) {
                // Function call: expr(args)
                const args: ASTNode[] = [];
                if (!this.check(TokenType.RightParen)) {
                    do {
                        args.push(this.assignment_expression());
                    } while (this.match(TokenType.Comma));
                }

                if (!this.match(TokenType.RightParen)) {
                    this.error("Expected ')' after function arguments");
                }

                expr = new CallExpressionNode(expr, args);
            }
            else if (this.match(TokenType.Dot)) {
                // Member access: expr.id
                if (!this.match(TokenType.Identifier)) {
                    this.error("Expected identifier after '.'");
                }

                expr = new MemberExpressionNode(
                    expr,
                    new IdentifierNode(this.previous().value),
                    false
                )
            }
            else if (this.match(TokenType.Arrow)) {
                // Arrow operator: expr->id
                if (!this.match(TokenType.Identifier)) {
                    this.error("Expected identifier after '->'");
                }

                expr = new ArrowExpressionNode(
                    expr,
                    new IdentifierNode(this.previous().value)
                )
            }
            else {
                break;
            }
        }

        return expr;
    }

    private primary_expression(): ASTNode {
        switch (this.peek().type) {
            case TokenType.True:
            case TokenType.False:
            case TokenType.Number:
            case TokenType.String:
                return this.constants();
            case TokenType.LeftBracket:
                return this.array();
            case TokenType.LeftBrace:
                return this.object();
            case TokenType.Fun:
                return this.lambda_function();
            case TokenType.Identifier: {
                const iden = this.identifier();
                if (this.peek().type == TokenType.LeftBrace) {
                    const object = this.object();
                    return new StructDefNode(iden.name, object);
                }

                return iden;
            }
            case TokenType.LeftParen:
                {
                    this.advance();
                    const expr = this.expression();
                    if (!this.match(TokenType.RightParen)) {
                        this.error("Expected ')' after expression.")
                    }

                    return expr;
                }
        }

        return this.error('Unknown');
    }

    private constants() {
        switch (this.peek().type) {
            case TokenType.True:
            case TokenType.False:
                return this.boolean();
            case TokenType.Number:
                return this.number();
            case TokenType.String:
                return this.string();
        }

        this.error('Unknown');
    }

    private number(): NumberNode {
        if (!this.match(TokenType.Number)) {
            this.error("Expected a number");
        }

        return new NumberNode(+this.previous().value);
    }

    private boolean(): BooleanNode {
        if (!this.match(TokenType.True) && !this.match(TokenType.False)) {
            this.error(`Expected a boolean`);
        }

        return new BooleanNode(this.previous().type == TokenType.True);
    }

    private string(): StringNode {
        if (!this.match(TokenType.String)) {
            this.error("Expected a string");
        }

        return new StringNode(this.previous().value);
    }

    private array(): ArrayNode {
        const elements: ASTNode[] = [];

        if (!this.match(TokenType.LeftBracket)) {
            this.error("Expected a '['");
        }

        if (!this.check(TokenType.RightBracket)) {
            do {
                elements.push(this.conditional_expression());
            } while (this.match(TokenType.Comma));
        }

        if (!this.match(TokenType.RightBracket)) {
            this.error("Expected a ']'");
        }

        return new ArrayNode(elements);
    }

    private object(): ObjectNode {
        const properties: PropertyNode[] = [];

        if (!this.match(TokenType.LeftBrace)) {
            this.error("Expected a '{'");
        }

        if (!this.check(TokenType.RightBrace)) {
            do {
                properties.push(this.property_definition());
            } while (
                this.match(TokenType.Comma) &&
                !this.check(TokenType.RightBrace)
            );
        }

        if (!this.match(TokenType.RightBrace)) {
            this.error("Expected a '}'");
        }

        return new ObjectNode(properties);
    }

    private property_definition(): PropertyNode {
        let key: string;
        switch (this.peek().type) {
            case TokenType.String:
            case TokenType.Identifier: {
                key = this.peek().value;
                if (!/^[a-zA-Z]+$/.test(key)) {
                    key = `'${key.replace(/'/g, "\\'")}'`;
                }
                this.advance();
                break;
            }
            default:
                this.error("Unexpected property name")
        }

        if (!this.match(TokenType.Colon)) {
            this.error("Expected ':' after property name");
        }

        const value = this.assignment_expression();

        return new PropertyNode(key, value);
    }

    private identifier(): IdentifierNode {
        if (!this.match(TokenType.Identifier)) {
            this.error("Expected an identifer");
        }

        let data_type = undefined;
        const name = this.previous().value;

        if (this.match(TokenType.Colon)) {
            data_type = this.type();
        }

        return new IdentifierNode(name, data_type);
    }

    public type(): ASTNode {
        let type: ASTNode | null = null;

        if ((type = this.generic_type())) {
            return type;
        } else if ((type = this.array_type())) {
            return type;
        } else if ((type = this.map_type())) {
            return type;
        } else if ((type = this.promise_type())) {
            return type;
        } else if ((type = this.function_type())) {
            return type;
        } else if ((type = this.struct_type())) {
            return type;
        } else if ((type = this.enum_type())) {
            return type;
        } else if ((type = this.primitive())) {
            return type;
        }

        return {
            type: "",
            accept() { }
        };
    }

    private generic_type(): GenericTypeNode | null {
        if (!this.match(TokenType.LT)) {
            return null;
        }

        const tp = this.type_parameters();


        if (!this.match(TokenType.GT)) {
            this.error("Expected token '>'");
        }

        const bt = this.type();

        return new GenericTypeNode(tp, bt);
    }

    private type_parameters(): TypeParameterNode[] {
        const params: TypeParameterNode[] = [];
        do {
            if (!this.match(TokenType.Identifier)) {
                this.error("Expected an identifier.")
            }

            const name = this.previous().value;

            let constraints: string[] = [];
            if (this.match(TokenType.Colon)) {
                do {
                    if (!this.match(TokenType.Identifier)) {
                        this.error("Expected an identifier");
                    }

                    constraints.push(this.previous().value);

                } while (this.match(TokenType.Plus))
            }

            params.push(new TypeParameterNode(name, constraints));
        } while (this.match(TokenType.Comma));

        return params;
    }

    private primitive(): ASTNode | null {
        if (this.match(TokenType.Identifier)) {
            return new TypeNode(this.previous().value);
        }

        return null;
    }

    private array_type(): ASTNode | null {
        const value = this.peek().value;

        if (value === "Array") {
            this.advance();
            if (!this.match(TokenType.LT)) {
                this.error("Expected <");
            }

            const type = this.type();

            if (!this.match(TokenType.GT)) {
                this.error("Expected >");
            }


            return new TypeNode("Array", [type]);
        }
        return null;
    }

    private promise_type(): ASTNode | null {
        const value = this.peek().value;

        if (value === "Promise") {
            this.advance();
            if (!this.match(TokenType.LT)) {
                this.error("Expected <");
            }

            const type = this.type();

            if (!this.match(TokenType.GT)) {
                this.error("Expected >");
            }


            return new TypeNode("Promise", [type]);
        }
        return null;
    }

    private map_type(): ASTNode | null {
        const value = this.peek().value;
        if (value === "Map") {
            this.advance();
            if (!this.match(TokenType.LT)) {
                this.error("Expected <");
            }
            const keyType = this.type();
            if (!this.match(TokenType.Comma)) {
                this.error("Expected ,");
            }
            const valueType = this.type();
            if (!this.match(TokenType.GT)) {
                this.error("Expected >");
            }
            return new TypeNode("Map", [keyType, valueType]);
        }
        return null;
    }

    private function_type(): ASTNode | null {
        if (!this.match(TokenType.LeftParen)) {
            return null;
        }

        const params = this.parameters_list();

        if (!this.match(TokenType.RightParen)) {
            this.error("Expected ')'");
        }

        if (!this.match(TokenType.Arrow)) {
            this.error("Expected '->'");
        }

        const ret = this.type();

        return new TypeNode("->", [params, ret]);
    }

    private struct_type() {
        if (!this.match(TokenType.Struct)) {
            return null;
        }

        if (!this.match(TokenType.Identifier)) {
            this.error("Expected a name for struct");
        }

        const name = this.previous().value;
        const typeParams: ASTNode[] = [];

        if (this.match(TokenType.LT)) {

            do {
                const typeParam = this.type();
                if (!typeParam) {
                    this.error("Expected a valid type parameter");
                }
                typeParams.push(typeParam);
            } while (this.match(TokenType.Comma));

            if (!this.match(TokenType.GT)) {
                this.error("Expected token '>'");
            }
        }

        return new TypeNode("struct", [name, ...typeParams])
    }

    private enum_type() {
        if (!this.match(TokenType.Enum)) {
            return null;
        }

        if (!this.match(TokenType.Identifier)) {
            this.error("Expected a name for enum");
        }

        const name = this.previous().value;
        const typeParams: ASTNode[] = [];

        if (this.match(TokenType.LT)) {

            do {
                const typeParam = this.type();
                if (!typeParam) {
                    this.error("Expected a valid type parameter");
                }
                typeParams.push(typeParam);
            } while (this.match(TokenType.Comma));

            if (!this.match(TokenType.GT)) {
                this.error("Expected token '>'");
            }
        }

        return new TypeNode("enum", [name, ...typeParams])
    }

    private struct_statement(): StructNode {
        if (!this.match(TokenType.Struct)) {
            this.error(`Expected token 'struct'`);
        }

        const name = this.peek().value;
        this.advance();

        let tp: TypeParameterNode[] | undefined = undefined;

        if (this.match(TokenType.LT)) {
            tp = this.type_parameters();

            if (!this.match(TokenType.GT)) {
                this.error(`Expected token '>'`);
            }
        }

        if (!this.match(TokenType.LeftBrace)) {
            this.error(`Expected token '{'`)
        }

        let body = this.field_list();

        if (!this.match(TokenType.RightBrace)) {
            this.error(`Expected token '}'`)
        }

        if (this.match(TokenType.SemiColon)) { }

        return new StructNode(name, body, tp);
    }

    private field_list(): FieldNode[] {
        const fields: FieldNode[] = [];

        while (!this.check(TokenType.RightBrace)) {
            const identifier = this.identifier();

            fields.push(new FieldNode(identifier));

            if (!this.match(TokenType.Comma)) {
                if (!this.check(TokenType.RightBrace)) {
                    this.error(`Expected ',' after field declaration`);
                }
            }
        }

        return fields;
    }

    private enum_statement(): EnumNode {
        if (!this.match(TokenType.Enum)) {
            this.error(`Expected token 'enum'`);
        }

        const name = this.peek().value;
        this.advance();

        let tp: TypeParameterNode[] | undefined = undefined;

        if (this.match(TokenType.LT)) {
            tp = this.type_parameters();

            if (!this.match(TokenType.GT)) {
                this.error(`Expected token '>'`);
            }
        }

        if (!this.match(TokenType.LeftBrace)) {
            this.error(`Expected token '{'`)
        }

        let body = this.enum_body();

        if (!this.match(TokenType.RightBrace)) {
            this.error(`Expected token '}'`)
        }

        if (this.match(TokenType.SemiColon)) { }

        return new EnumNode(name, body, tp);
    }

    private enum_body(): EnumVariantNode[] {
        const variants: EnumVariantNode[] = [];

        while (!this.check(TokenType.RightBrace)) {
            if (!this.match(TokenType.Identifier)) {
                this.error(`Expected an identifier`);
            }

            const name = this.previous().value;

            let value: EnumVariantValueNode | undefined = undefined;

            if (this.match(TokenType.LeftBrace)) {
                value = new StructVariantNode(this.field_list());

                if (!this.match(TokenType.RightBrace)) {
                    this.error(`Expected '}' to close struct variant`);
                }

            } else if (this.match(TokenType.LeftParen)) {
                value = new TupleVariantNode(this.tuple_payload());

                if (!this.match(TokenType.RightParen)) {
                    this.error(`Expected ')' to close tuple variant`);
                }
            } else if (this.match(TokenType.Equals)) {
                value = new ConstantVariantNode(this.constants());
            }

            variants.push(new EnumVariantNode(name, value));

            if (!this.match(TokenType.Comma)) {
                if (!this.check(TokenType.RightBrace)) {
                    this.error(`Expected ',' after enum variant`);
                }
            }
        }

        return variants;
    }

    private tuple_payload(): ASTNode[] {
        const types: ASTNode[] = [];

        do {
            types.push(this.type());
        } while (this.match(TokenType.Comma));

        return types;
    }
}