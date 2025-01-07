import { Frame, lookup_symbol, new_frame, set_symbol } from "../dsa/symtab";
import { Extension } from "../plugin/plugin";
import { ASTNode, ASTVisitor, BlockNode, Builtin, CallExpressionNode, ExpressionStatementNode, FunctionDecNode, IdentifierNode, ParameterNode, ParametersListNode, ReturnNode, SourceElementsNode, StructNode, VariableListNode, VariableNode } from "../types";

export class SEMA implements ASTVisitor {
    private plugins: Extension<any>[] = [];
    public global: Frame = new_frame(null);
    private errors: any[] = [];

    public error(err: String) {
        this.errors.push(err);
    }

    public plugin(p: Extension<any>) {
        this.plugins.push(p);
        return this;
    }

    public before_accept(
        node: ASTNode,
        args?: Record<string, any>
    ) {
        // console.log(node.type)
        this.plugins.forEach(plugin => plugin.beforeAccept?.(node, this, args));
    }

    public visit(node?: ASTNode, args?: Record<string, any>): void {
        if (node == undefined) return;

        const handledByPlugin = this.plugins.some(plugin =>
            plugin.handleNode?.(node, this, args)
        );

        if (!handledByPlugin) {
            return node.accept(this, args);
        }
    }

    public after_accept(
        node: ASTNode,
        args?: Record<string, any>
    ) {
        this.plugins.forEach(plugin => plugin.afterAccept?.(node, this, args));
    }

    public run(
        ast: ASTNode,
        builtin: Record<string, Builtin>
    ) {
        Object.entries(builtin)
            .map(([key, value]) => {
                if (
                    value.type == "function"
                ) {
                    this.global.symbol_table.set(
                        key,
                        new FunctionDecNode(key, undefined, new BlockNode([]), true)
                    );
                } else if (value.type == "variable") {
                    this.global.symbol_table.set(
                        key,
                        new VariableNode(new IdentifierNode(key))
                    );
                }
            })

        this.visit(ast, {
            frame: this.global
        })

        if (this.errors.length > 0)
            throw new Error(this.errors.join("\n"))

        return ast;
    }

    visitSourceElements(
        node: SourceElementsNode,
        args?: Record<string, any>
    ) {
        node.sources.forEach(s => this.visit(s, args));
    }

    visitExpressionStatement(node: ExpressionStatementNode, args?: Record<string, any>) {
        this.visit(node.expression, args);
    }

    visitFunctionDec(
        node: FunctionDecNode,
        { frame }: { frame: Frame }
    ) {
        set_symbol(node.identifier, node, frame);

        const nf = new_frame(frame);
        this.visit(node.params, { frame: nf });
        this.visit(node.body, { frame: nf });
    }

    visitParametersList(node: ParametersListNode, args?: Record<string, any>) {
        node.parameters.forEach(p => this.visit(p, args))
    }

    visitParameter(
        node: ParameterNode,
        { frame }: { frame: Frame }
    ) {
        const name = node.identifier.name;
        set_symbol(name, node, frame);
    }

    visitBlock(
        node: BlockNode,
        { frame }: { frame: Frame }
    ) {
        const nf = new_frame(frame)
        node.body.forEach(b => this.visit(b, { frame: nf }));
    }

    visitReturn(
        node: ReturnNode,
        { frame }: { frame: Frame }
    ) {
        if (node.expression)
            this.visit(node.expression, { frame });
    }

    visitVariableList(
        node: VariableListNode,
        { frame }: { frame: Frame }
    ) {
        node.variables.forEach(v => this.visit(v, { frame }))
    }

    visitVariable(
        node: VariableNode,
        { frame }: { frame: Frame }
    ) {
        const name = node.identifier.name;
        this.visit(node.expression, { frame });
        set_symbol(name, node, frame);
    }

    visitCallExpression(
        node: CallExpressionNode,
        { frame }: { frame: Frame }
    ) {
        const res = this.visit(node.callee, { frame });
        node.args.forEach(a => this.visit(a, { frame }))

        if (res !== undefined && (res as FunctionDecNode) instanceof FunctionDecNode) {
            const fun = res as FunctionDecNode;
            if (fun.inbuilt) return;

            const len = (fun.params as ParametersListNode).parameters.length;
            if (len !== node.args.length) {
                this.error(`Function '${fun.identifier}' expected ${len} argument(s) but got ${node.args.length}.`)
            }
        }
    }

    visitStruct(
        node: StructNode,
        { frame }: { frame: Frame }
    ) {
        set_symbol(node.name, node, frame);
    }

    visitIdentifier(
        node: IdentifierNode,
        { frame }: { frame: Frame }
    ) {
        const iden = lookup_symbol(node.name, frame);
        if (!iden)
            this.error(`Symbol ${node.name} is undefined.`)

        return iden;
    }
}