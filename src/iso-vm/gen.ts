import { Extension } from "../plugin/plugin";
import { ASTNode, FunctionDecNode, JS, ReturnNode } from "../types";

const before_accept: Record<string, any> = {
    "FunctionDec": (
        node: FunctionDecNode,
        visitor: JS,
        args?: Record<string, any>
    ) => {
        if (args) {
            if ('main' in args && node.identifier == args.main)
                args.in_main = true;
        }
    }
}

const after_accept: Record<string, any> = {
    "FunctionDec": (
        node: FunctionDecNode,
        visitor: JS,
        args?: Record<string, any>
    ) => {
        if (args) {
            if ('main' in args && node.identifier == args.main)
                args.in_main = false;
        }
    }
}

const handle_node: Record<string, any> = {
    "Return": (
        node: ReturnNode,
        visitor: JS,
        args?: Record<string, any>
    ) => {
        if (args) {
            if (args.in_main) {
                if (node.expression) {
                    visitor.write("return new ivm.ExternalCopy(");
                    args.in_return_expr = true;
                    visitor.visit(node.expression, args);
                    args.in_return_expr = false;
                    visitor.write(").copyInto();");
                    return true;
                }
                visitor.write("return;");
                return true;
            }
        }
    }
}


export class ISOVM implements Extension<JS> {
    name = "isolate-vm";

    public beforeAccept(
        node: ASTNode,
        visitor: JS,
        args?: Record<string, any>
    ): void {
        before_accept[node.type]?.(node, visitor, args);
    }

    public afterAccept(
        node: ASTNode,
        visitor: JS,
        args?: Record<string, any>
    ): void {
        after_accept[node.type]?.(node, visitor, args);
    }

    public handleNode(
        node: ASTNode,
        visitor: JS,
        args?: Record<string, any>
    ): boolean | void {
        return handle_node[node.type]?.(node, visitor, args);
    }
}