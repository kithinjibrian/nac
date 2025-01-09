import {
    ArrayNode,
    ASTNode,
    ASTVisitor,
    AwaitExpressionNode,
    BinaryOpNode,
    BlockNode,
    BooleanNode,
    Builtin,
    CallExpressionNode,
    ExpressionStatementNode,
    FieldNode,
    FunctionDecNode,
    IdentifierNode,
    IfElseNode,
    LambdaNode,
    MemberExpressionNode,
    NumberNode,
    ObjectNode,
    ParameterNode,
    ParametersListNode,
    PropertyNode,
    ReturnNode,
    SourceElementsNode,
    StringNode,
    StructDefNode,
    StructNode,
    VariableListNode,
    VariableNode
} from "../types";

import { Extension } from "../plugin/plugin";

export class JS implements ASTVisitor {
    private codeBuffer: string[] = [];
    private plugins: Extension<any>[] = [];
    private indentLevel: number = 0;

    constructor(
        public builtin: Record<string, Builtin>
    ) {

    }

    public write(code: string) {
        this.codeBuffer.push(code);
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
        switch (node.type) {
            case "Let":
            case "ExpressionStatement":
            case "Return": {
                this.increaseIndent()
                this.codeBuffer.push(this.indent());
            }
        }

        this.plugins.forEach(plugin => plugin.beforeAccept?.(node, this, args));
    }

    public visit(node?: ASTNode, args?: Record<string, any>): void {
        if (node == undefined) return;

        const handledByPlugin = this.plugins.some(plugin =>
            plugin.handleNode?.(node, this, args)
        );

        if (!handledByPlugin) {
            node.accept(this, args);
        }
    }

    public after_accept(
        node: ASTNode,
        args?: Record<string, any>
    ) {
        this.plugins.forEach(plugin => plugin.afterAccept?.(node, this, args));

        switch (node.type) {
            case "Let":
            case "ExpressionStatement":
            case "Return":
            case "Struct":
            case "FunctionDec": {
                this.decreaseIndent();
            }
        }
    }

    public create_args(args: any[]): ASTNode[] {
        return args.map(arg => {
            if (typeof arg == "string") {
                return new StringNode(arg)
            } else if (typeof arg == "boolean") {
                return new BooleanNode(arg);
            } else if (typeof arg == "number") {
                return new NumberNode(arg);
            } else if (typeof arg == "object" && arg !== null) {
                if (Array.isArray(arg)) {
                    return new ArrayNode(this.create_args(arg))
                } else {
                    const props: PropertyNode[] = Object.entries(arg)
                        .map(([key, value]) => {
                            return new PropertyNode(key, this.create_args([value])[0]);
                        });

                    return new ObjectNode(
                        props
                    )
                }
            }

            throw new Error(`Unsupported argument type: ${typeof arg}`);
        })
    }

    public init(
        ast: SourceElementsNode,
        opts: any
    ) {
        ast.sources.push(
            new ExpressionStatementNode(
                new CallExpressionNode(
                    new IdentifierNode(opts.main),
                    this.create_args(opts.args)
                )
            )
        );

        this.visit(ast, {
            target: opts.target,
            main: opts.main
        })
    }

    public run(
        ast: ASTNode,
        opts: Record<string, any>
    ) {
        this.codeBuffer = [];
        this.indentLevel = 0;

        this.init(ast as SourceElementsNode, opts);

        return this;
    }

    public code() {
        return this.codeBuffer.join('');
    }

    private indent(): string {
        if (this.indentLevel <= 0) return "";

        return '    '.repeat(this.indentLevel);
    }

    private increaseIndent() {
        this.indentLevel++;
    }

    private decreaseIndent() {
        this.indentLevel--;
    }

    visitSourceElements(
        node: SourceElementsNode,
        args?: Record<string, any>
    ) {
        node.sources.forEach(src => {
            this.visit(src, args);
        });
    }

    visitExpressionStatement(
        node: ExpressionStatementNode,
        args?: Record<string, any>
    ) {
        this.visit(node.expression, args)
        this.codeBuffer.push(`;`);
    }

    visitFunctionDec(
        node: FunctionDecNode,
        args?: Record<string, any>
    ) {
        if (node.is_async)
            this.codeBuffer.push("async ");

        this.codeBuffer.push(`function ${node.identifier}(`);
        if (node.params) {
            this.increaseIndent();
            this.visit(node.params, args);
            this.decreaseIndent();
        }

        this.codeBuffer.push(") ");
        this.visit(node.body, args);

        this.codeBuffer.push("\n\n")
    }

    visitLambda(node: LambdaNode, args?: Record<string, any>) {
        this.codeBuffer.push("(");
        this.visit(node.params, args);
        this.codeBuffer.push(") => ");
        node.body.accept(this, args);
    }

    visitParametersList(node: ParametersListNode, args?: Record<string, any>) {
        node.parameters.forEach((p, index) => {
            if (index > 0) this.codeBuffer.push(", ");
            this.visit(p, args);
        });
    }

    visitParameter(node: ParameterNode, args?: Record<string, any>) {
        this.visit(node.identifier, args);
    }

    visitBlock(node: BlockNode, args?: Record<string, any>) {
        this.codeBuffer.push("{\n");
        node.body.forEach((b, index) => {
            this.visit(b, args);
            if (index < node.body.length - 1)
                this.codeBuffer.push(`\n`);
        });
        this.codeBuffer.push(`\n${this.indent()}}`);
    }

    visitReturn(node: ReturnNode, args?: Record<string, any>) {
        this.codeBuffer.push(`return`);

        if (node.expression) {
            this.codeBuffer.push(` `);
            this.visit(node.expression, args);
        }

        this.codeBuffer.push(`;`);
    }

    visitCallExpression(node: CallExpressionNode, args?: Record<string, any>) {
        this.visit(node.callee, args);
        this.codeBuffer.push("(")
        node.args.map((arg, index) => {
            this.visit(arg, args);
            if (index < node.args.length - 1)
                this.codeBuffer.push(", ");
        });
        this.codeBuffer.push(")")
    }

    visitMemberExpression(
        node: MemberExpressionNode,
        args?: Record<string, any>
    ) {
        this.visit(node.object, args);
        if (node.computed) {
            this.codeBuffer.push("[");
            this.visit(node.property, args);
            this.codeBuffer.push("]");
        } else {
            this.codeBuffer.push(".");
            this.visit(node.property, args);
        }
    }

    visitVariableList(
        node: VariableListNode,
        args?: Record<string, any>
    ) {
        this.codeBuffer.push(`let `);
        node.variables.forEach((v, index) => {
            if (index > 0) this.codeBuffer.push(", ");
            this.visit(v, args);
        });
        this.codeBuffer.push(`;`);
    }

    visitVariable(
        node: VariableNode,
        args?: Record<string, any>
    ) {
        this.visit(node.identifier, args);
        if (node.expression) {
            this.codeBuffer.push(` = `);
            this.visit(node.expression, args);
        }
    }

    visitBinaryOp(
        node: BinaryOpNode,
        args?: Record<string, any>
    ) {
        this.codeBuffer.push("(")
        this.visit(node.left, args);
        this.codeBuffer.push(` ${node.operator} `);
        this.visit(node.right, args);
        this.codeBuffer.push(")")
    }

    visitIfElse(node: IfElseNode, args?: Record<string, any>) {
        this.codeBuffer.push("if (")
        this.visit(node.condition, args);
        this.codeBuffer.push(") ")
        this.visit(node.consequent, args);
        //node.alternate?.accept(this, args);
    }

    visitAwaitExpression(node: AwaitExpressionNode, args?: Record<string, any>) {
        this.codeBuffer.push("await ");
        this.visit(node.expression, {
            promise: true,
            ...args
        });
    }

    visitIdentifier(
        node: IdentifierNode,
        args?: Record<string, any>
    ) {
        this.codeBuffer.push(node.name);
    }

    visitStructDef(node: StructDefNode, args?: Record<string, any>) {
        this.write(`new ${node.name}(`)
        this.visit(node.object, args);
        this.write(")");
    }

    visitStruct(node: StructNode, args?: Record<string, any>) {
        this.write(`class ${node.name} {\n`)
        this.increaseIndent();
        this.write(`${this.indent()}constructor ({`)
        node.body.map((f, index) => {
            this.visit(f, args);
            if (index < node.body.length - 1)
                this.write(", ");
        });

        this.write("}) {\n")

        this.increaseIndent();

        node.body.map(f => {
            this.write(`${this.indent()}this.`)
            this.visit(f, args);
            this.write(" = ")
            this.visit(f, args);
            this.write(";\n")
        })

        this.decreaseIndent();

        this.write(`${this.indent()}}\n}\n\n`)
    }

    visitField(node: FieldNode, args?: Record<string, any>) {
        this.visit(node.field, args);
    }

    visitObject(node: ObjectNode, args?: Record<string, any>) {
        this.codeBuffer.push("{")
        node.properties.map((p, index) => {
            this.visit(p, args);
            if (index < node.properties.length - 1)
                this.codeBuffer.push(", ");
        })
        this.codeBuffer.push("}")
    }

    visitProperty(node: PropertyNode, args?: Record<string, any>) {
        this.codeBuffer.push(`${node.key} : `);
        this.visit(node.value, args);
    }

    visitArray(node: ArrayNode, args?: Record<string, any>) {
        this.codeBuffer.push("[")
        node.elements.map((elem, index) => {
            this.visit(elem, args);
            if (index < node.elements.length - 1)
                this.codeBuffer.push(", ");
        })
        this.codeBuffer.push("]")
    }

    visitBoolean(node: BooleanNode, args?: Record<string, any>) {
        this.codeBuffer.push(`${node.value ? 'true' : 'false'}`);
    }

    visitNumber(
        node: NumberNode,
        args?: Record<string, any>
    ) {
        this.codeBuffer.push(`${node.value}`);
    }

    visitString(
        node: StringNode,
        args?: Record<string, any>
    ) {
        this.codeBuffer.push(`'${node.value}'`);
    }
}