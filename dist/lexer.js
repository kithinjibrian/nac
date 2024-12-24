"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = void 0;
var TokenType;
(function (TokenType) {
    TokenType["Number"] = "Number";
    TokenType["Plus"] = "Plus";
    TokenType["Minus"] = "Minus";
    TokenType["Multiply"] = "Multiply";
    TokenType["Divide"] = "Divide";
    TokenType["LeftParen"] = "LeftParen";
    TokenType["RightParen"] = "RightParen";
    TokenType["Identifier"] = "Identifier";
    TokenType["Equals"] = "Equals";
    TokenType["Whitespace"] = "Whitespace";
    TokenType["EOF"] = "EOF";
})(TokenType || (TokenType = {}));
class Lexer {
    constructor(input) {
        this.position = 0;
        this.line = 1;
        this.column = 1;
        this.input = input;
    }
    peek() {
        return this.position < this.input.length ? this.input[this.position] : '\0';
    }
    advance() {
        const char = this.peek();
        this.position++;
        if (char === '\n') {
            this.line++;
            this.column = 1;
        }
        else {
            this.column++;
        }
        return char;
    }
    skipWhitespace() {
        while (/\s/.test(this.peek())) {
            this.advance();
        }
    }
    readNumber() {
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
    readIdentifier() {
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
    getNextToken() {
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
            case '=':
                this.advance();
                return { type: TokenType.Equals, value: '=', line: this.line, column: currentColumn };
        }
        if (/\d/.test(char)) {
            return this.readNumber();
        }
        if (/[a-zA-Z_]/.test(char)) {
            return this.readIdentifier();
        }
        throw new Error(`Unexpected character '${char}' at line ${this.line}, column ${this.column}`);
    }
    tokenize() {
        const tokens = [];
        let token;
        do {
            token = this.getNextToken();
            tokens.push(token);
        } while (token.type !== TokenType.EOF);
        return tokens;
    }
}
exports.Lexer = Lexer;
