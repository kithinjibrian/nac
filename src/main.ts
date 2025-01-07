import { ISOVM } from "./iso-vm/gen";
import {
    builtin,
    Builtin,
    JS,
    Lexer,
    Parser,
    Phases,
    SEMA,
    TypeChecker
} from "./types";

export * from "./types";

export class Nac {
    constructor(
        code: string,
        builtin: Record<string, Builtin>,
        passes?: any[]
    ) {
        const _passes = new Phases(
            passes ?? [
                new SEMA(),
                new TypeChecker()
            ],
            builtin
        );

        const n = `
        struct Result<T> {
            tag: string,
            data: T
        };

        fun fetch(url, opts): struct Result {
            return fetchJS(url, opts);
        }

        ${code}
        `;

        const lexer = new Lexer(n);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();

        _passes.run(ast);

        new JS(builtin)
            .plugin(new ISOVM())
            .run(ast, {
                target: "isolate-vm",
                main: "main",
                args: []
            }).runJS()
    }
}

new Nac(
    `
    fun main() {
        let a = fetch("https://api.dafifi.net", { method: "GET"});
        return a;
    }
    `,
    builtin
)