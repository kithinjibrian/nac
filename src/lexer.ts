export enum TokenType {
    Number = 'Number',
    String = 'String',
    Plus = 'Plus',
    Minus = 'Minus',
    Arrow = 'Arrow',
    Multiply = 'Multiply',
    Divide = 'Divide',
    LeftParen = 'LeftParen',
    RightParen = 'RightParen',
    LeftBrace = 'LeftBrace',
    RightBrace = 'RightBrace',
    LeftBracket = 'LeftBracket',
    RightBracket = 'RightBracket',
    Identifier = 'Identifier',
    Equals = 'Equals',
    Comma = 'Comma',
    Dot = 'Dot',
    SemiColon = 'SemiColon',
    QuestionMark = 'QuestionMark',
    Colon = 'Colon',
    Pipe = 'Pipe',
    Or = 'Or',
    And = 'And',
    Caret = 'Caret',
    GT = 'GT',
    GTE = 'GTE',
    SR = 'SR',
    LT = 'LT',
    LTE = 'LTE',
    SL = 'SL',
    Modulo = 'Modulo',
    PlusEquals = 'PlusEquals',
    MinusEquals = 'MinusEquals',
    MultiplyEquals = 'MultiplyEquals',
    DivideEquals = 'DivideEquals',
    ModuloEquals = 'ModuloEquals',
    SREquals = 'SREquals',
    SlEquals = 'SlEquals',
    AndEquals = 'AndEquals',
    XorEquals = 'XorEquals',
    OrEquals = 'OrEquals',
    IsEqual = 'IsEqual',
    IsNotEqual = 'IsNotEqual',
    Ampersand = 'Ampersand',
    Whitespace = 'Whitespace',
    EOF = 'EOF',
    Increment = 'Increment',
    Return = "Return",
    Continue = "Continue",
    Break = "Break",
    True = "True",
    False = "False",
    While = "While",
    Decrement = 'Decrement',
    ExclamationMark = 'ExclamationMark',
    For = 'For',
    Do = 'Do',
    If = 'If',
    Else = 'Else',
    Switch = 'Switch',
    Case = 'Case',
    Default = 'Default',
    Let = 'Let',
    Fun = 'Fun',
    Struct = 'Struct',
    Export = 'Export',
    Import = 'Import',
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

    private skipComment(): void {
        if (this.peek() === '/') {
            this.advance();
            if (this.peek() === '/') { // single-line comment
                while (this.peek() !== '\n' && this.peek() !== '\0') {
                    this.advance();
                }
            } else if (this.peek() === '*') { // multi-line comment
                this.advance();
                while (!(this.peek() === '*' && this.input[this.position + 1] === '/')) {
                    this.advance();
                }
                this.advance(); // Skip the closing `*`
                this.advance(); // Skip the `/`
            }
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

        const keywords = new Map<string, TokenType>([
            ["continue", TokenType.Continue],
            ["return", TokenType.Return],
            ["break", TokenType.Break],
            ["while", TokenType.While],
            ["for", TokenType.For],
            ["do", TokenType.Do],
            ["if", TokenType.If],
            ["else", TokenType.Else],
            ["switch", TokenType.Switch],
            ["case", TokenType.Case],
            ["default", TokenType.Default],
            ["let", TokenType.Let],
            ["fun", TokenType.Fun],
            ["struct", TokenType.Struct],
            ["export", TokenType.Export],
            ["import", TokenType.Import],
            ["true", TokenType.True],
            ["false", TokenType.False],
        ]);

        let type = keywords.get(value) || TokenType.Identifier;

        return {
            type,
            value: value,
            line: this.line,
            column: startColumn
        };
    }

    private readString(): Token {
        const startColumn = this.column;
        let value = '';
        this.advance(); // Skip the opening quote

        while (this.peek() !== '"' && this.peek() !== '\0') {
            if (this.peek() === '\\') {
                this.advance(); // Skip the backslash
                const escapeChar = this.advance();
                const escapeSequences: { [key: string]: string } = {
                    'n': '\n',
                    't': '\t',
                    '\\': '\\',
                    '"': '"',
                };
                value += escapeSequences[escapeChar] || escapeChar; // Handle escape sequences
            } else {
                value += this.advance();
            }
        }

        if (this.peek() === '\0') {
            throw new Error(`Unterminated string at line ${this.line}, column ${this.column}`);
        }

        this.advance(); // Skip the closing quote
        return { type: TokenType.String, value, line: this.line, column: startColumn };
    }

    public getNextToken(): Token {
        this.skipWhitespace();
        this.skipComment();

        if (this.position >= this.input.length) {
            return { type: TokenType.EOF, value: '', line: this.line, column: this.column };
        }

        const char = this.peek();
        const currentColumn = this.column;

        switch (char) {
            case '+':
                this.advance();
                if (this.peek() === '+') {
                    this.advance();
                    return { type: TokenType.Increment, value: '++', line: this.line, column: currentColumn };
                }
                if (this.peek() === '=') {
                    this.advance();
                    return { type: TokenType.PlusEquals, value: '+=', line: this.line, column: currentColumn };
                }
                return { type: TokenType.Plus, value: '+', line: this.line, column: currentColumn };
            case '-':
                this.advance();
                if (this.peek() === '-') {
                    this.advance();
                    return { type: TokenType.Decrement, value: '--', line: this.line, column: currentColumn };
                }
                if (this.peek() === '>') {
                    this.advance();
                    return { type: TokenType.Arrow, value: '->', line: this.line, column: currentColumn };
                }
                if (this.peek() === '=') {
                    this.advance();
                    return { type: TokenType.MinusEquals, value: '-=', line: this.line, column: currentColumn };
                }
                return { type: TokenType.Minus, value: '-', line: this.line, column: currentColumn };
            case '*':
                this.advance();
                if (this.peek() === '=') {
                    this.advance();
                    return { type: TokenType.MultiplyEquals, value: '*=', line: this.line, column: currentColumn };
                }
                return { type: TokenType.Multiply, value: '*', line: this.line, column: currentColumn };
            case '/':
                this.advance();
                if (this.peek() === '=') {
                    this.advance();
                    return { type: TokenType.DivideEquals, value: '/=', line: this.line, column: currentColumn };
                }
                return { type: TokenType.Divide, value: '/', line: this.line, column: currentColumn };
            case '%':
                this.advance();
                if (this.peek() === '=') {
                    this.advance();
                    return { type: TokenType.ModuloEquals, value: '%=', line: this.line, column: currentColumn };
                }
                return { type: TokenType.Modulo, value: '%', line: this.line, column: currentColumn };
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
            case '[':
                this.advance();
                return { type: TokenType.LeftBracket, value: '[', line: this.line, column: currentColumn };
            case ']':
                this.advance();
                return { type: TokenType.RightBracket, value: ']', line: this.line, column: currentColumn };
            case '=':
                this.advance();
                if (this.peek() == '=') {
                    this.advance();
                    return { type: TokenType.IsEqual, value: '==', line: this.line, column: currentColumn };
                }
                return { type: TokenType.Equals, value: '=', line: this.line, column: currentColumn };
            case ',':
                this.advance();
                return { type: TokenType.Comma, value: ',', line: this.line, column: currentColumn };
            case '.':
                this.advance();
                return { type: TokenType.Dot, value: '.', line: this.line, column: currentColumn };
            case ';':
                this.advance();
                return { type: TokenType.SemiColon, value: ';', line: this.line, column: currentColumn };
            case '?':
                this.advance();
                return { type: TokenType.QuestionMark, value: '?', line: this.line, column: currentColumn };
            case '!':
                this.advance();
                if (this.peek() == '=') {
                    this.advance();
                    return { type: TokenType.IsNotEqual, value: '!=', line: this.line, column: currentColumn };
                }
                return { type: TokenType.ExclamationMark, value: '!', line: this.line, column: currentColumn };
            case ':':
                this.advance();
                return { type: TokenType.Colon, value: ':', line: this.line, column: currentColumn };
            case '|':
                this.advance();
                if (this.peek() === '|') {
                    this.advance();
                    return { type: TokenType.Or, value: '||', line: this.line, column: currentColumn };
                }
                if (this.peek() === '=') {
                    this.advance();
                    return { type: TokenType.OrEquals, value: '|=', line: this.line, column: currentColumn };
                }
                return { type: TokenType.Pipe, value: '|', line: this.line, column: currentColumn };
            case '^':
                this.advance();
                if (this.peek() === '=') {
                    this.advance();
                    return { type: TokenType.XorEquals, value: '^=', line: this.line, column: currentColumn };
                }
                return { type: TokenType.Caret, value: '^', line: this.line, column: currentColumn };
            case '&':
                this.advance();
                if (this.peek() === '&') {
                    this.advance();
                    return { type: TokenType.And, value: '&&', line: this.line, column: currentColumn };
                }
                if (this.peek() === '=') {
                    this.advance();
                    return { type: TokenType.AndEquals, value: '&=', line: this.line, column: currentColumn };
                }
                return { type: TokenType.Ampersand, value: '&', line: this.line, column: currentColumn };
            case '>':
                this.advance();
                if (this.peek() === '=') {
                    this.advance();
                    return { type: TokenType.GTE, value: '>=', line: this.line, column: currentColumn };
                }
                if (this.peek() === '>') {
                    this.advance();
                    if (this.peek() === '=') {
                        this.advance();
                        return { type: TokenType.SREquals, value: '>>=', line: this.line, column: currentColumn };
                    }
                    return { type: TokenType.SR, value: '>>', line: this.line, column: currentColumn };
                }
                return { type: TokenType.GT, value: '>', line: this.line, column: currentColumn };
            case '<':
                this.advance();
                if (this.peek() === '=') {
                    this.advance();
                    return { type: TokenType.LTE, value: '<=', line: this.line, column: currentColumn };
                }
                if (this.peek() === '<') {
                    this.advance();
                    if (this.peek() === '=') {
                        this.advance();
                        return { type: TokenType.SlEquals, value: '<<=', line: this.line, column: currentColumn };
                    }
                    return { type: TokenType.SL, value: '<<', line: this.line, column: currentColumn };
                }
                return { type: TokenType.LT, value: '<', line: this.line, column: currentColumn };
        }

        if (/\d/.test(char)) {
            return this.readNumber();
        }

        if (/[a-zA-Z_]/.test(char)) {
            return this.readIdentifier();
        }

        if (char === '"') {
            return this.readString();
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
