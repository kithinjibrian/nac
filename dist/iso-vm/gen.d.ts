import { Extension } from "../plugin/plugin";
import { ASTNode, JS } from "../types";
export declare class ISOVM implements Extension<JS> {
    name: string;
    beforeAccept(node: ASTNode, visitor: JS, args?: Record<string, any>): void;
    afterAccept(node: ASTNode, visitor: JS, args?: Record<string, any>): void;
    handleNode(node: ASTNode, visitor: JS, args?: Record<string, any>): boolean | void;
}
//# sourceMappingURL=gen.d.ts.map