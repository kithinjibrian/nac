export enum TokenType {
    Number = 'Number',
    Plus = 'Plus',
    Minus = 'Minus',
    Multiply = 'Multiply',
    Divide = 'Divide',
    LeftParen = 'LeftParen',
    RightParen = 'RightParen',
    LeftBrace = 'LeftBrace',
    RightBrace = 'RightBrace',
    Identifier = 'Identifier',
    Equals = 'Equals',
    Comma = 'Comma',
    Whitespace = 'Whitespace',
    EOF = 'EOF'
}

export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
}

export class Lexer {
    private input: string;
    private position: number = 0;
    private line: number = 1;
    private column: number = 1;

    constructor(input: string) {
        this.input = input;
    }

    private peek(): string {
        return this.position < this.input.length ? this.input[this.position] : '\0';
    }

    private advance(): string {
        const char = this.peek();
        this.position++;
        if (char === '\n') {
            this.line++;
            this.column = 1;
        } else {
            this.column++;
        }
        return char;
    }

    private skipWhitespace(): void {
        while (/\s/.test(this.peek())) {
            this.advance();
        }
    }

    private readNumber(): Token {
        const start = this.position;
        const startColumn = this.column;
        let value = '';

        while (/\d/.test(this.peek())) {
            value += this.advance();
        }

        // Handle decimal points
        if (this.peek() === '.') {
            value += this.advance();
            while (/\d/.test(this.peek())) {
                value += this.advance();
            }
        }

        return {
            type: TokenType.Number,
            value: value,
            line: this.line,
            column: startColumn
        };
    }

    private readIdentifier(): Token {
        const startColumn = this.column;
        let value = '';

        while (/[a-zA-Z_]/.test(this.peek())) {
            value += this.advance();
        }

        return {
            type: TokenType.Identifier,
            value: value,
            line: this.line,
            column: startColumn
        };
    }

    public getNextToken(): Token {
        this.skipWhitespace();

        if (this.position >= this.input.length) {
            return { type: TokenType.EOF, value: '', line: this.line, column: this.column };
        }

        const char = this.peek();
        const currentColumn = this.column;

        switch (char) {
            case '+':
                this.advance();
                return { type: TokenType.Plus, value: '+', line: this.line, column: currentColumn };
            case '-':
                this.advance();
                return { type: TokenType.Minus, value: '-', line: this.line, column: currentColumn };
            case '*':
                this.advance();
                return { type: TokenType.Multiply, value: '*', line: this.line, column: currentColumn };
            case '/':
                this.advance();
                return { type: TokenType.Divide, value: '/', line: this.line, column: currentColumn };
            case '(':
                this.advance();
                return { type: TokenType.LeftParen, value: '(', line: this.line, column: currentColumn };
            case ')':
                this.advance();
                return { type: TokenType.RightParen, value: ')', line: this.line, column: currentColumn };
            case '{':
                this.advance();
                return { type: TokenType.LeftBrace, value: '{', line: this.line, column: currentColumn };
            case '}':
                this.advance();
                return { type: TokenType.RightBrace, value: '}', line: this.line, column: currentColumn };
            case '=':
                this.advance();
                return { type: TokenType.Equals, value: '=', line: this.line, column: currentColumn };
            case ',':
                this.advance();
                return { type: TokenType.Comma, value: ',', line: this.line, column: currentColumn };
        }

        if (/\d/.test(char)) {
            return this.readNumber();
        }

        if (/[a-zA-Z_]/.test(char)) {
            return this.readIdentifier();
        }

        throw new Error(`Unexpected character '${char}' at line ${this.line}, column ${this.column}`);
    }

    public tokenize(): Token[] {
        const tokens: Token[] = [];
        let token: Token;

        do {
            token = this.getNextToken();
            tokens.push(token);
        } while (token.type !== TokenType.EOF);

        return tokens;
    }
}