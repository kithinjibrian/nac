"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenType = void 0;
var TokenType;
(function (TokenType) {
    TokenType["Number"] = "Number";
    TokenType["String"] = "String";
    TokenType["Plus"] = "Plus";
    TokenType["Minus"] = "Minus";
    TokenType["Arrow"] = "Arrow";
    TokenType["Multiply"] = "Multiply";
    TokenType["Divide"] = "Divide";
    TokenType["LeftParen"] = "LeftParen";
    TokenType["RightParen"] = "RightParen";
    TokenType["LeftBrace"] = "LeftBrace";
    TokenType["RightBrace"] = "RightBrace";
    TokenType["LeftBracket"] = "LeftBracket";
    TokenType["RightBracket"] = "RightBracket";
    TokenType["Identifier"] = "Identifier";
    TokenType["Equals"] = "Equals";
    TokenType["Comma"] = "Comma";
    TokenType["Dot"] = "Dot";
    TokenType["SemiColon"] = "SemiColon";
    TokenType["QuestionMark"] = "QuestionMark";
    TokenType["Colon"] = "Colon";
    TokenType["Pipe"] = "Pipe";
    TokenType["Or"] = "Or";
    TokenType["And"] = "And";
    TokenType["Caret"] = "Caret";
    TokenType["GT"] = "GT";
    TokenType["GTE"] = "GTE";
    TokenType["SR"] = "SR";
    TokenType["LT"] = "LT";
    TokenType["LTE"] = "LTE";
    TokenType["SL"] = "SL";
    TokenType["Xor"] = "Xor";
    TokenType["Modulo"] = "Modulo";
    TokenType["Ellipsis"] = "Ellipsis";
    TokenType["PlusEquals"] = "PlusEquals";
    TokenType["MinusEquals"] = "MinusEquals";
    TokenType["MultiplyEquals"] = "MultiplyEquals";
    TokenType["DivideEquals"] = "DivideEquals";
    TokenType["ModuloEquals"] = "ModuloEquals";
    TokenType["SREquals"] = "SREquals";
    TokenType["SlEquals"] = "SlEquals";
    TokenType["AndEquals"] = "AndEquals";
    TokenType["OP"] = "OP";
    TokenType["Newline"] = "Newline";
    TokenType["XorEquals"] = "XorEquals";
    TokenType["OrEquals"] = "OrEquals";
    TokenType["IsEqual"] = "IsEqual";
    TokenType["IsNotEqual"] = "IsNotEqual";
    TokenType["Ampersand"] = "Ampersand";
    TokenType["Whitespace"] = "Whitespace";
    TokenType["EOF"] = "EOF";
    TokenType["Increment"] = "Increment";
    TokenType["Return"] = "Return";
    TokenType["Continue"] = "Continue";
    TokenType["Break"] = "Break";
    TokenType["True"] = "True";
    TokenType["False"] = "False";
    TokenType["While"] = "While";
    TokenType["Decrement"] = "Decrement";
    TokenType["ExclamationMark"] = "ExclamationMark";
    TokenType["For"] = "For";
    TokenType["Do"] = "Do";
    TokenType["If"] = "If";
    TokenType["Else"] = "Else";
    TokenType["Switch"] = "Switch";
    TokenType["Case"] = "Case";
    TokenType["Default"] = "Default";
    TokenType["Let"] = "Let";
    TokenType["Fun"] = "Fun";
    TokenType["Struct"] = "Struct";
    TokenType["Export"] = "Export";
    TokenType["Import"] = "Import";
    TokenType["Extends"] = "Extends";
    TokenType["Async"] = "Async";
    TokenType["Await"] = "Await";
})(TokenType || (exports.TokenType = TokenType = {}));
