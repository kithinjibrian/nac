"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = void 0;
const token_1 = require("./token");
function one_char(c) {
    switch (c) {
        case '(':
            return token_1.TokenType.LeftParen;
        case ')':
            return token_1.TokenType.RightParen;
        case '[':
            return token_1.TokenType.LeftBracket;
        case ']':
            return token_1.TokenType.RightBracket;
        case ':':
            return token_1.TokenType.Colon;
        case ',':
            return token_1.TokenType.Comma;
        case ';':
            return token_1.TokenType.SemiColon;
        case '+':
            return token_1.TokenType.Plus;
        case '-':
            return token_1.TokenType.Minus;
        case '*':
            return token_1.TokenType.Multiply;
        case '/':
            return token_1.TokenType.Divide;
        case '|':
            return token_1.TokenType.Pipe;
        case '&':
            return token_1.TokenType.Ampersand;
        case '<':
            return token_1.TokenType.LT;
        case '>':
            return token_1.TokenType.GT;
        case '=':
            return token_1.TokenType.Equals;
        case '.':
            return token_1.TokenType.Dot;
        case '%':
            return token_1.TokenType.Modulo;
        case '{':
            return token_1.TokenType.LeftBrace;
        case '}':
            return token_1.TokenType.RightBrace;
        case '^':
            return token_1.TokenType.Caret;
        case '~':
            return token_1.TokenType.Xor;
        case '\n':
            return token_1.TokenType.Newline;
        default:
            return token_1.TokenType.OP;
    }
}
function two_char(c1, c2) {
    switch (c1) {
        case '=':
            switch (c2) {
                case '=':
                    return token_1.TokenType.IsEqual;
            }
            break;
        case '!':
            switch (c2) {
                case '=':
                    return token_1.TokenType.IsNotEqual;
            }
            break;
        case '<':
            switch (c2) {
                case '=':
                    return token_1.TokenType.LTE;
                case '<':
                    return token_1.TokenType.SL;
            }
            break;
        case '>':
            switch (c2) {
                case '=':
                    return token_1.TokenType.GTE;
                case '>':
                    return token_1.TokenType.SR;
            }
            break;
        case '+':
            switch (c2) {
                case '=':
                    return token_1.TokenType.PlusEquals;
            }
            break;
        case '-':
            switch (c2) {
                case '=':
                    return token_1.TokenType.MinusEquals;
                case '>':
                    return token_1.TokenType.Arrow;
            }
            break;
        case '*':
            switch (c2) {
                case '=':
                    return token_1.TokenType.MultiplyEquals;
            }
            break;
        case '/':
            switch (c2) {
                case '=':
                    return token_1.TokenType.DivideEquals;
            }
            break;
        case '|':
            switch (c2) {
                case '=':
                    return token_1.TokenType.OrEquals;
            }
            break;
        case '%':
            switch (c2) {
                case '=':
                    return token_1.TokenType.ModuloEquals;
            }
            break;
        case '&':
            switch (c2) {
                case '=':
                    return token_1.TokenType.AndEquals;
            }
            break;
        case '^':
            switch (c2) {
                case '=':
                    return token_1.TokenType.XorEquals;
            }
            break;
        default:
            return token_1.TokenType.OP;
    }
    return token_1.TokenType.OP;
}
function three_char(c1, c2, c3) {
    switch (c1) {
        case '<':
            switch (c2) {
                case '<':
                    switch (c3) {
                        case '=':
                            return token_1.TokenType.SlEquals;
                    }
                    break;
            }
            break;
        case '>':
            switch (c2) {
                case '>':
                    switch (c3) {
                        case '=':
                            return token_1.TokenType.SREquals;
                    }
                    break;
            }
            break;
        case '.':
            switch (c2) {
                case '.':
                    switch (c3) {
                        case '.':
                            return token_1.TokenType.Ellipsis;
                    }
                    break;
            }
            break;
        default:
            return token_1.TokenType.OP;
    }
    return token_1.TokenType.OP;
}
class Lexer {
    constructor(input) {
        this.position = 0;
        this.line = 1;
        this.column = 1;
        this.input = input;
    }
    peek(offset = 0) {
        return this.position + offset < this.input.length ? this.input[this.position + offset] : '\0';
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
    skipComment() {
        if (this.peek() === '/') {
            const nextChar = this.peek(1);
            if (nextChar === '/') {
                while (this.peek() !== '\n' && this.peek() !== '\0') {
                    this.advance();
                }
            }
            else if (nextChar === '*') {
                this.advance(); // Skip '/'
                this.advance(); // Skip '*'
                while (!(this.peek() === '*' && this.peek(1) === '/') && this.peek() !== '\0') {
                    this.advance();
                }
                this.advance(); // Skip '*'
                this.advance(); // Skip '/'
            }
        }
    }
    readNumber() {
        const startColumn = this.column;
        let value = '';
        while (/\d/.test(this.peek())) {
            value += this.advance();
        }
        if (this.peek() === '.') {
            value += this.advance();
            while (/\d/.test(this.peek())) {
                value += this.advance();
            }
        }
        return { type: token_1.TokenType.Number, value, line: this.line, column: startColumn };
    }
    readIdentifier() {
        const startColumn = this.column;
        let value = '';
        while (/[a-zA-Z0-9_]/.test(this.peek())) {
            value += this.advance();
        }
        const keywords = new Map([
            ["continue", token_1.TokenType.Continue],
            ["return", token_1.TokenType.Return],
            ["break", token_1.TokenType.Break],
            ["while", token_1.TokenType.While],
            ["for", token_1.TokenType.For],
            ["do", token_1.TokenType.Do],
            ["if", token_1.TokenType.If],
            ["else", token_1.TokenType.Else],
            ["switch", token_1.TokenType.Switch],
            ["case", token_1.TokenType.Case],
            ["default", token_1.TokenType.Default],
            ["let", token_1.TokenType.Let],
            ["fun", token_1.TokenType.Fun],
            ["struct", token_1.TokenType.Struct],
            ["export", token_1.TokenType.Export],
            ["import", token_1.TokenType.Import],
            ["true", token_1.TokenType.True],
            ["false", token_1.TokenType.False],
            ["extends", token_1.TokenType.Extends]
        ]);
        return {
            type: keywords.get(value) || token_1.TokenType.Identifier,
            value,
            line: this.line,
            column: startColumn
        };
    }
    readString() {
        const startColumn = this.column;
        const quote = this.peek();
        let value = '';
        this.advance(); // Skip opening quote
        while (this.peek() !== quote && this.peek() !== '\0') {
            if (this.peek() === '\\') {
                this.advance();
                const escapeChar = this.advance();
                const escapeSequences = {
                    'n': '\n', 't': '\t', '\\': '\\', '"': '"', "'": "'"
                };
                value += escapeSequences[escapeChar] || escapeChar;
            }
            else {
                value += this.advance();
            }
        }
        if (this.peek() === '\0') {
            throw new Error(`Unterminated string at line ${this.line}, column ${this.column}`);
        }
        this.advance(); // Skip closing quote
        return { type: token_1.TokenType.String, value, line: this.line, column: startColumn };
    }
    readOperator() {
        const startColumn = this.column;
        const c1 = this.peek();
        const c2 = this.peek(1);
        const c3 = this.peek(2);
        // Try three-character operators
        const threeCharOp = three_char(c1, c2, c3);
        if (threeCharOp !== token_1.TokenType.OP) {
            this.advance(); // First char
            this.advance(); // Second char
            this.advance(); // Third char
            return { type: threeCharOp, value: c1 + c2 + c3, line: this.line, column: startColumn };
        }
        // Try two-character operators
        const twoCharOp = two_char(c1, c2);
        if (twoCharOp !== token_1.TokenType.OP) {
            this.advance(); // First char
            this.advance(); // Second char
            return { type: twoCharOp, value: c1 + c2, line: this.line, column: startColumn };
        }
        // Single-character operators
        const oneCharOp = one_char(c1);
        if (oneCharOp !== token_1.TokenType.OP) {
            this.advance();
            return { type: oneCharOp, value: c1, line: this.line, column: startColumn };
        }
        throw new Error(`Invalid operator at line ${this.line}, column ${this.column}`);
    }
    getNextToken() {
        this.skipWhitespace();
        this.skipComment();
        if (this.position >= this.input.length) {
            return { type: token_1.TokenType.EOF, value: '', line: this.line, column: this.column };
        }
        const char = this.peek();
        if (/\d/.test(char))
            return this.readNumber();
        if (/[a-zA-Z_]/.test(char))
            return this.readIdentifier();
        if (char === '"' || char === "'")
            return this.readString();
        return this.readOperator();
    }
    tokenize() {
        const tokens = [];
        let token;
        do {
            token = this.getNextToken();
            tokens.push(token);
        } while (token.type !== token_1.TokenType.EOF);
        return tokens;
    }
}
exports.Lexer = Lexer;
