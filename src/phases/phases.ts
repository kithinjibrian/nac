import { ASTNode, ASTVisitor } from "../parser/ast";

export type Builtin =
    {
        type: "function",
        async?: boolean,
        signature: string,
        filter?: Function,
        exec: Function
    }
    | {
        type: "variable",
        signature?: string,
        value: any
    }

export class Phases {

    constructor(
        public passes: any[],
        public builtin: Record<string, Builtin>
    ) { }

    push(pass: ASTVisitor) {
        this.passes.push(pass);
    }

    run(ast: ASTNode) {
        this.passes.forEach((pass) => {
            if (pass.run)
                pass.run(ast, this.builtin);
        })
    }
}