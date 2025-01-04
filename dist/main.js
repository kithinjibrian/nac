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
exports.Nac = exports.builtin = void 0;
const types_1 = require("./types");
__exportStar(require("./types"), exports);
exports.builtin = {
    print: {
        type: "function",
        signature: "<T>(args: T) -> integer",
        filter: (args) => {
            return args.map(i => i.str());
        },
        exec: (args) => {
            console.log(args.join(" "));
        }
    }
};
class Nac {
    constructor(code, builtin, passes) {
        const _passes = new types_1.Phases(passes !== null && passes !== void 0 ? passes : [
            new types_1.TypeChecker(),
            new types_1.Interpreter()
        ], builtin);
        const lexer = new types_1.Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new types_1.Parser(tokens);
        const ast = parser.parse();
        _passes.run(ast);
    }
}
exports.Nac = Nac;
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
