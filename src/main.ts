import { Builtin, Interpreter } from "./interpreter";
import { Lexer } from "./lexer";
import { Type } from "./objects/base";
import { Parser } from "./parser";

export const builtin: Record<string, Builtin> = {
    print: {
        signature: "[string] -> number",
        filter: (args: Type<any>[]) => {
            return args.map(i => i.str())
        },
        exec: (args: any[]) => {
            console.log(args.join(" "))
        }
    }
}

export class Nac {
    constructor(code: string, builtin: Record<string, Builtin>) {
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();
        new Interpreter(ast, builtin);
    }
}

const nac = new Nac(
    `
    let a = 0;
    for(a; a < 10; a += 1) {
        if(a == 5)
            continue;
        print(a);
    }
    `,
    builtin
)