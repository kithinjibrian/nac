import {
    Builtin,
    Interpreter,
    Lexer,
    Parser,
    Phases,
    Type,
    TypeChecker
} from "./types";

export * from "./types";

export const builtin: Record<string, Builtin> = {
    print: {
        type: "function",
        signature: "<T>(args: T) -> integer",
        filter: (args: Type<any>[]) => {
            return args.map(i => i.str())
        },
        exec: (args: any[]) => {
            console.log(args.join(" "))
        }
    }
}

export class Nac {
    constructor(
        code: string,
        builtin: Record<string, Builtin>,
        passes?: any[]
    ) {
        const _passes = new Phases(
            passes ?? [
                new TypeChecker(),
                new Interpreter()
            ],
            builtin
        );

        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();

        _passes.run(ast);
    }
}

// new Nac(
//     `
//     struct User {
//         name: string;
//     }

//     let a = User {
//         name: "kithinji"
//     };

//     print(a.name);
//     `,
//     builtin
// )