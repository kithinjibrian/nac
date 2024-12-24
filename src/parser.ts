import { ArrayNode, ASTNode, BlockNode, ExpressionStatementNode, ForNode, FunctionDecNode, IdentifierNode, IfElseNode, NumberNode, ObjectNode, ParameterNode, ParametersListNode, PropertNode, ReturnNode, SourceElementsNode, StringNode, VariableListNode, VariableNode, WhileNode } from "./ast";
import { Token, TokenType } from "./lexer";

export class Parser {
    private tokens: Token[] = [];
    private current: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private is_at_end(): boolean {
        return this.peek().type === TokenType.EOF;
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

        return {
            type: 'SourceElements',
            sources
        }
    }

    private source_element(): ASTNode {
        if (this.peek().type == TokenType.Fun) {
            return this.function_dec()
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

        return {
            type: 'FunctionDec',
            inbuilt: false,
            identifier: functionName,
            params: parameters,
            body: this.block()
        };
    }

    private parameters_list(): ParametersListNode | undefined {

        if (this.peek().type == TokenType.RightParen) {
            return undefined;
        }

        const parameters = [];

        do {
            parameters.push(this.parameter());
        } while (this.match(TokenType.Comma));

        return {
            type: 'ParametersList',
            parameters
        }
    }

    private parameter(): ParameterNode {
        const identifier = this.identifier();

        return {
            type: 'Parameter',
            identifier
        }
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

        return {
            type: 'Block',
            body
        }
    }

    private return_statement(): ReturnNode {
        if (!this.match(TokenType.Return)) {
            this.error("Expected 'return'");
        }

        if (this.match(TokenType.SemiColon)) {
            return {
                type: 'Return'
            }
        }

        const expression = this.expression();

        if (!this.match(TokenType.SemiColon)) {
            this.error("Expected ';' after return statement");
        }

        return {
            type: 'Return',
            expression
        }
    }

    private break_statement(): ASTNode {
        if (!this.match(TokenType.Break)) {
            this.error("Expected 'break'");
        }

        if (!this.match(TokenType.SemiColon)) {
            this.error("Expected ';' after break");
        }

        return {
            type: "Break"
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
            type: "Continue"
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

        return {
            type: 'Let',
            variables
        }
    }

    private variable(): VariableNode {
        const identifier = this.identifier();
        let expression = undefined;

        if (this.match(TokenType.Equals)) {
            expression = this.assignment_expression();
        }

        return {
            type: 'Variable',
            identifier,
            expression
        }
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

        return {
            type: 'While',
            expression,
            body
        }
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

        return {
            type: "For",
            init,
            condition,
            update,
            body
        }
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

            return {
                type: 'IfElse',
                condition,
                consequent,
                alternate
            }
        }

        return {
            type: 'IfElse',
            condition,
            consequent
        }
    }

    private expression_statement(): ExpressionStatementNode {
        const expression = this.expression();

        if (!this.match(TokenType.SemiColon)) {
            this.error("Expected ';' after expression");
        }

        return {
            type: 'ExpressionStatement',
            expression
        };
    }

    private expression(): ASTNode {
        const expr = this.assignment_expression();

        if (this.match(TokenType.Comma)) {
            const expressions = [expr];

            do {
                expressions.push(this.assignment_expression());
            } while (this.match(TokenType.Comma));

            return {
                type: 'Expression',
                expressions
            } as ASTNode;
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
                right
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
                alternate
            } as ASTNode;
        }

        return condition;
    }

    private logical_or_expression(): ASTNode {
        let expr = this.logical_and_expression();

        while (this.match(TokenType.Or)) {
            const operator = this.previous().value;
            const right = this.logical_and_expression();
            expr = {
                type: 'BinaryExpression',
                operator,
                left: expr,
                right
            } as ASTNode;
        }

        return expr;
    }

    private logical_and_expression(): ASTNode {
        let expr = this.bitwise_or_expression();

        while (this.match(TokenType.And)) {
            const operator = this.previous().value;
            const right = this.logical_and_expression();
            expr = {
                type: 'BinaryExpression',
                operator,
                left: expr,
                right
            } as ASTNode;
        }

        return expr;
    }

    private bitwise_or_expression(): ASTNode {
        let expr = this.bitwise_xor_expression();

        while (this.match(TokenType.Pipe)) {
            const operator = this.previous().value;
            const right = this.bitwise_xor_expression();
            expr = {
                type: 'BinaryExpression',
                operator,
                left: expr,
                right
            } as ASTNode;
        }

        return expr;
    }

    private bitwise_xor_expression(): ASTNode {
        let expr = this.bitwise_and_expression();

        while (this.match(TokenType.Caret)) {
            const operator = this.previous().value;
            const right = this.bitwise_and_expression();
            expr = {
                type: 'BinaryExpression',
                operator,
                left: expr,
                right
            } as ASTNode;
        }

        return expr;
    }

    private bitwise_and_expression(): ASTNode {
        let expr = this.equality_expression();

        while (this.match(TokenType.Ampersand)) {
            const operator = this.previous().value;
            const right = this.equality_expression();
            expr = {
                type: 'BinaryExpression',
                operator,
                left: expr,
                right
            } as ASTNode;
        }

        return expr;
    }

    private equality_expression(): ASTNode {
        let expr = this.relational_expression();

        if (this.is_equality_operator(this.peek().type)) {
            const operator = this.advance().value;
            const right = this.relational_expression();

            expr = {
                type: 'BinaryExpression',
                operator,
                left: expr,
                right
            } as ASTNode;

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

            expr = {
                type: 'BinaryExpression',
                operator,
                left: expr,
                right
            } as ASTNode;
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

            expr = {
                type: 'BinaryExpression',
                operator,
                left: expr,
                right
            } as ASTNode;

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

            expr = {
                type: 'BinaryExpression',
                operator,
                left: expr,
                right
            } as ASTNode;

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

            expr = {
                type: 'BinaryExpression',
                operator,
                left: expr,
                right
            } as ASTNode;

        }

        return expr;
    }

    private is_multiplicative_operator(type: TokenType): boolean {
        return type === TokenType.Multiply ||
            type === TokenType.Divide ||
            type === TokenType.Modulo
    }

    private unary_expression(): ASTNode {
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

    private postfix_expression(): ASTNode {
        let expr = this.primary_expression();

        while (true) {
            if (this.match(TokenType.LeftBracket)) {
                // Array access: expr[index]
                const index = this.expression();
                if (!this.match(TokenType.RightBracket)) {
                    this.error("Expected ']' after array index");
                }
                expr = {
                    type: 'MemberExpression',
                    object: expr,
                    property: index,
                    computed: true
                } as ASTNode;
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

                expr = {
                    type: 'CallExpression',
                    callee: expr,
                    arguments: args
                } as ASTNode;
            }
            else if (this.match(TokenType.Dot)) {
                // Member access: expr.id
                if (!this.match(TokenType.Identifier)) {
                    this.error("Expected identifier after '.'");
                }

                expr = {
                    type: 'MemberExpression',
                    object: expr,
                    property: {
                        type: 'Identifier',
                        name: this.previous().value
                    },
                    computed: false
                } as ASTNode;
            }
            else if (this.match(TokenType.Arrow)) {
                // Arrow operator: expr->id
                if (!this.match(TokenType.Identifier)) {
                    this.error("Expected identifier after '->'");
                }

                expr = {
                    type: 'ArrowExpression',
                    object: expr,
                    property: {
                        type: 'Identifier',
                        name: this.previous().value
                    }
                } as ASTNode;
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

    private primary_expression(): ASTNode {
        switch (this.peek().type) {
            case TokenType.Number:
                return this.number();
            case TokenType.String:
                return this.string();
            case TokenType.Identifier:
                return this.identifier();
            case TokenType.LeftParen:
                {
                    this.advance();
                    const expr = this.expression();
                    if (!this.match(TokenType.RightParen)) {
                        this.error("Expected ')' after expression.")
                    }

                    return expr;
                }
            case TokenType.LeftBracket:
                return this.array();
            case TokenType.LeftBrace:
                return this.object();
        }

        return this.error('Unknown');
    }

    private number(): NumberNode {
        if (!this.match(TokenType.Number)) {
            this.error("Expected a number");
        }

        return {
            type: 'Number',
            value: +this.previous().value
        }
    }

    private string(): StringNode {
        if (!this.match(TokenType.String)) {
            this.error("Expected a string");
        }

        return {
            type: 'String',
            value: this.previous().value
        }
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

        return {
            type: 'Array',
            elements
        }
    }

    private object(): ObjectNode {
        const properties: PropertNode[] = [];

        if (!this.match(TokenType.LeftBrace)) {
            this.error("Expected a '{'");
        }

        if (!this.check(TokenType.RightBrace)) {
            do {
                properties.push(this.property_definition());
            } while (this.match(TokenType.Comma));
        }

        if (!this.match(TokenType.RightBrace)) {
            this.error("Expected a '}'");
        }

        return {
            type: 'Object',
            properties
        }
    }

    private property_definition(): PropertNode {
        let key: ASTNode;
        switch (this.peek().type) {
            case TokenType.String:
                key = this.string();
                break;
            case TokenType.Identifier:
                key = this.identifier();
                break;
            default:
                this.error("Unexpected property name")
        }

        if (!this.match(TokenType.Colon)) {
            this.error("Expected ':' after property name");
        }

        const value = this.assignment_expression();

        return {
            type: 'Property',
            key,
            value
        }
    }

    private identifier(): IdentifierNode {
        if (!this.match(TokenType.Identifier)) {
            this.error("Expected an identifer");
        }

        return {
            type: 'Identifier',
            name: this.previous().value
        }
    }
}