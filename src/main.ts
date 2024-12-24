import { Lexer } from "./lexer";
import { Parser } from "./parser";

const lexer = new Lexer(
    `
    fun on_add(x,y) {
    }
    `
);
const tokens = lexer.tokenize();
const parser = new Parser(tokens);
const ast = parser.parse();

console.log(ast);