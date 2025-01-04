import { TokenType } from "./token";
export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
}
export declare class Lexer {
    private input;
    private position;
    private line;
    private column;
    constructor(input: string);
    private peek;
    private advance;
    private skipWhitespace;
    private skipComment;
    private readNumber;
    private readIdentifier;
    private readString;
    private readOperator;
    getNextToken(): Token;
    tokenize(): Token[];
}
//# sourceMappingURL=lexer.d.ts.map