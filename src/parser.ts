import { Token, TokenType } from "./lexer";

interface ASTNode {
    type: string;
}

interface SourceElementsNode extends ASTNode {
    type: 'SourceElements',

}

interface FunctionDecNode extends ASTNode {
    type: 'FunctionDec';
    identifier: string;
    params?: IdentifierNode[];
    body?: any;
}

interface NumberNode extends ASTNode {
    type: 'Number';
    value: number;
}

interface BinaryOpNode extends ASTNode {
    type: 'BinaryOp';
    operator: string;
    left: ASTNode;
    right: ASTNode;
}

interface UnaryOpNode extends ASTNode {
    type: 'UnaryOp';
    operator: string;
    operand: ASTNode;
}

interface IdentifierNode extends ASTNode {
    type: 'Identifier';
    name: string;
}

interface AssignmentNode extends ASTNode {
    type: 'Assignment';
    variable: IdentifierNode;
    value: ASTNode;
}

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
        if (this.match(TokenType.Identifier)) {
            const iden = this.previous().value;

            if (iden == 'fun') {
                return this.function_dec()
            }
        }

        return this.statement();
    }

    private function_dec(): FunctionDecNode {
        // Expect function name
        if (!this.match(TokenType.Identifier)) {
            this.error("Expected function name");
        }

        const functionName = this.previous().value;

        // Expect opening parenthesis
        if (!this.match(TokenType.LeftParen)) {
            this.error("Expected '(' after function name");
        }

        // Parse parameters
        const parameters: IdentifierNode[] = [];
        if (!this.check(TokenType.RightParen)) {
            do {
                if (!this.match(TokenType.Identifier)) {
                    this.error("Expected parameter name");
                }
                parameters.push({
                    type: 'Identifier',
                    name: this.previous().value
                });
            } while (this.match(TokenType.Comma));
        }

        // Expect closing parenthesis
        if (!this.match(TokenType.RightParen)) {
            this.error("Expected ')' after parameters");
        }

        // Expect opening brace
        if (!this.match(TokenType.LeftBrace)) {
            this.error("Expected '{' before function body");
        }

        // Expect closing brace
        if (!this.match(TokenType.RightBrace)) {
            this.error("Expected '}' after function body");
        }

        return {
            type: 'FunctionDec',
            identifier: functionName,
            params: parameters,
            body: null
        };
    }

    private statement(): ASTNode {
        return {
            type: 'statement'
        }
    }
}