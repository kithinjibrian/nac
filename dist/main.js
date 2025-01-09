"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./types"), exports);
/*

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

// new Nac(
//     `
//     fun main() {
//         let a = fetch("https://api.dafifi.net", { method: "GET"});
//         return a;
//     }
//     `,
//     builtin
// )

*/ 
