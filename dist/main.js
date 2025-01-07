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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Nac = void 0;
const types_1 = require("./types");
__exportStar(require("./types"), exports);
class Nac {
    constructor(code, builtin, passes) {
        const _passes = new types_1.Phases(passes !== null && passes !== void 0 ? passes : [
            //new TypeChecker(),
            new types_1.JS(),
            //new CPS(),
            //new Interpreter()
        ], builtin);
        const lexer = new types_1.Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new types_1.Parser(tokens);
        const ast = parser.parse();
        _passes.run(ast);
    }
}
exports.Nac = Nac;
new Nac(`
    let a = 0;
    if(a < 8) {

    }
    `, types_1.builtin);
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        return 90;
    });
}
main();
