"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phases = void 0;
class Phases {
    constructor(passes, builtin) {
        this.passes = passes;
        this.builtin = builtin;
    }
    push(pass) {
        this.passes.push(pass);
    }
    run(ast) {
        this.passes.forEach((pass) => {
            if (pass.run)
                ast = pass.run(ast, this.builtin);
        });
    }
}
exports.Phases = Phases;
