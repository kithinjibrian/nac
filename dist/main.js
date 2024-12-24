"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lexer_1 = require("./lexer");
const lexer = new lexer_1.Lexer("x = 42 + (15 * 3)");
const tokens = lexer.tokenize();
console.log(tokens);
