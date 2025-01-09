import { ASTNode, ASTVisitor } from "../parser/ast";
export type Builtin = {
    type: "function";
    async?: boolean;
    signature: string;
    filter?: Function;
    exec: Function;
} | {
    type: "variable";
    signature?: string;
    value: any;
};
export declare class Phases {
    passes: any[];
    builtin: Record<string, Builtin>;
    constructor(passes: any[], builtin: Record<string, Builtin>);
    push(pass: ASTVisitor): void;
    run(ast: ASTNode): ASTNode;
}
//# sourceMappingURL=phases.d.ts.map