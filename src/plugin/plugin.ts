import { ASTNode } from "../types";

export abstract class Extension<T> {
    abstract name: string;
    abstract beforeAccept(node: ASTNode, visitor: T, args?: Record<string, any>): void;
    abstract afterAccept(node: ASTNode, visitor: T, args?: Record<string, any>): void;
    abstract handleNode(node: ASTNode, visitor: T, args?: Record<string, any>): boolean | void;;
}