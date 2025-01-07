import { ArrayNode, ASTNode, ASTVisitor, AwaitExpressionNode, BinaryOpNode, BlockNode, CallExpressionNode, ContinuationNode, ExpressionStatementNode, ForNode, FunctionDecNode, IdentifierNode, IfElseNode, LambdaNode, MemberExpressionNode, NumberNode, ObjectNode, ParameterNode, ReturnNode, SourceElementsNode, StringNode, StructDefNode, VariableListNode, VariableNode, WhileNode } from "../parser/ast";
import { ArrayType } from "../objects/array";
import { Type } from "../objects/base";
import { BoolType } from "../objects/bool";
import { create_object } from "../objects/create";
import { DictType } from "../objects/dict";
import { FunctionType } from "../objects/function";
import { NumberType } from "../objects/number";
import { StringType } from "../objects/string";
import { Builtin } from "../phases/phases";
import { Frame, lookup_symbol, new_frame, set_symbol } from "../dsa/symtab";
import { EventLoop } from "./event";
import { Task } from "./task";
import { FutureType } from "../objects/future";
import { NullType } from "../objects/null";
import { LambdaType } from "../objects/lambda";

export class Interpreter implements ASTVisitor {
    public eventLoop: EventLoop = new EventLoop();
    public builtin: Record<string, Builtin> = {};
    public global: Frame = new_frame(null);

    public insert(
        builtin: Record<string, Builtin>,
        symbol_table: Record<string, any>
    ) {
        this.builtin = builtin;

        Object.entries(builtin)
            .map(([key, value]) => {
                if (value.type == "function") {
                    const inbuiltFunction = new FunctionDecNode(key, undefined, new BlockNode([]), true);
                    symbol_table.set(key, inbuiltFunction);
                } else if (value.type == "variable") {
                    const inbuiltVariable = new VariableNode(new IdentifierNode(key), undefined, create_object(value.value));
                    symbol_table.set(key, inbuiltVariable);
                }
            })
    }

    public run(
        ast: ASTNode,
        builtin: Record<string, Builtin>
    ) {
        this.insert(builtin, this.global.symbol_table);
        this.scheduleTask(ast, this.global, () => { });
    }

    private scheduleTask(
        node: ASTNode,
        frame: Frame,
        callback: (result: Type<any>) => void
    ) {
        const task = new Task((frame: Frame) => {
            try {
                node.accept(this, { frame });
                if (frame.return_flag) return frame.return_value;
            } catch (e) {
                console.log(e);
            }
        }, this, [frame], [callback])

        this.eventLoop.enqueue(task);
    }

    public async execute_function(
        fn: FunctionDecNode,
        args: ASTNode[],
        frame: Frame
    ) {
        const nf = new_frame(frame);

        const evaluatedArgs: Type<any>[] = [];
        for (const arg of args) {
            arg.accept(this, { frame });
            const argValue = frame.stack.pop();
            if (!argValue) throw new Error("Stack underflow - argument evaluation");
            evaluatedArgs.push(argValue);
        }

        if (fn.params) {
            fn.params.parameters.forEach((param, i) => {
                let _param: ParameterNode = param;
                set_symbol(
                    _param.identifier.name,
                    new ParameterNode(
                        _param.identifier,
                        _param.variadic,
                        _param.expression,
                        i < evaluatedArgs.length ? evaluatedArgs[i] : undefined,
                    ),
                    nf
                );
            });
        }

        if (fn.inbuilt) {
            const name = fn.identifier;
            const inbuilt = this.builtin[name];

            if (inbuilt.type != "function") {
                throw new Error(`Object ${name} not callable`);
            }

            const filtered = inbuilt.filter
                ? inbuilt.filter(evaluatedArgs)
                : evaluatedArgs.map(i => i.getValue())

            let value;
            if (inbuilt.async) {
                try {
                    value = await inbuilt.exec(filtered);
                } catch (e: any) {
                    throw new Error(e.message);
                }
            } else {
                value = inbuilt.exec(filtered)
            }

            if (value) {
                frame.stack.push(create_object(value));
            }

        } else {
            if (fn.is_async) {
                const future = new FutureType(new NullType());
                this.scheduleTask(fn.body, nf, (result) => {
                    if (result) {
                        future.complete(result);
                    }
                })

                frame.stack.push(future);
            } else {
                fn.body.accept(this, { frame: nf });
                if (nf.return_value)
                    frame.stack.push(nf.return_value);
            }
        }
    }

    before_accept(node: ASTNode) {
        console.log(node.type);
    }

    visitSourceElements(
        node: SourceElementsNode,
        args?: Record<string, any>
    ) {
        for (const n of node.sources) {
            n.accept(this, args);
        }
    }

    visitExpressionStatement(node: ExpressionStatementNode, args?: Record<string, any>) {
        node.expression.accept(this, args);
    }

    visitFunctionDec(
        node: FunctionDecNode,
        { frame }: { frame: Frame }
    ) {
        set_symbol(node.identifier, node, frame);
    }

    visitLambda(
        node: LambdaNode,
        { frame }: { frame: Frame }
    ) {
        frame.stack.push(new LambdaType(node));
    }

    visitAwaitExpression(
        node: AwaitExpressionNode,
        { frame }: { frame: Frame }
    ) {
        node.expression.accept(this, { frame });

        const future = frame.stack.pop() as FutureType;

        const task = new Task((frame: Frame) => {
            frame.stack.push(future.getValue());
        }, this, [frame]);

        this.eventLoop.microtaskQueue.push(task);
        this.eventLoop.run();

        // console.log(task);
    }

    visitContinuation(
        node: ContinuationNode,
        { frame }: { frame: Frame }
    ) {
        node.body.accept(this, { frame })
    }

    visitCallExpression(
        node: CallExpressionNode,
        { frame }: { frame: Frame }
    ) {
        if (node.callee instanceof IdentifierNode) {
            const fn: FunctionDecNode = lookup_symbol((node.callee as IdentifierNode).name, frame);

            if (!fn) {
                throw new Error(`Function ${(node.callee as IdentifierNode).name} is not defined`);
            }

            this.execute_function(fn, node.args, frame);
        } else {
            node.callee.accept(this, { frame });
            const fn = frame.stack.pop() as FunctionType;

            this.execute_function(fn.getValue(), node.args, frame);
        }

    }

    visitMemberExpression(
        node: MemberExpressionNode,
        { frame }: { frame: Frame }
    ) {
        node.object.accept(this, { frame });
        const object = frame.stack.pop() as Type<any>;

        let propertyValue: Type<any>;
        if (node.computed) {
            node.property.accept(this, { frame });
            propertyValue = frame.stack.pop() as Type<any>;
        } else {
            propertyValue = new StringType((node.property as IdentifierNode).name);
        }

        const value = object.get(propertyValue);
        if (!value) {
            throw new Error("Property not found");
        }

        frame.stack.push(value);
    }

    visitBlock(
        node: BlockNode,
        { frame }: { frame: Frame }) {
        const nf = new_frame(frame);

        for (const n of node.body) {
            n.accept(this, { frame: nf });

            if (
                nf.return_flag ||
                nf.break_flag ||
                nf.continue_flag
            ) {
                break;
            }
        }

        frame.continue_flag = nf.continue_flag;
        frame.break_flag = nf.break_flag;
        frame.return_flag = nf.return_flag;
        frame.return_value = nf.return_value;
    }

    visitReturn(
        node: ReturnNode,
        { frame }: { frame: Frame }
    ) {
        if (node.expression) {
            node.expression.accept(this, { frame });
            frame.return_value = frame.stack.pop() as Type<any>;
        }

        frame.return_flag = true;
    }

    visitBreak(node: ASTNode, { frame }: { frame: Frame }) {
        frame.break_flag = true;
    }

    visitContinue(node: ASTNode, { frame }: { frame: Frame }) {
        frame.continue_flag = true;
    }

    visitIfElse(
        node: IfElseNode,
        { frame }: { frame: Frame }
    ) {
        node.condition.accept(this, { frame });

        let condition = frame.stack.pop() as Type<any>;

        if (condition.getValue()) {
            node.consequent.accept(this, { frame });
        } else {
            if (node.alternate) {
                node.alternate.accept(this, { frame });
            }
        }
    }

    visitWhile(
        node: WhileNode,
        { frame }: { frame: Frame }
    ) {
        node.expression.accept(this, { frame });
        let condition = frame.stack.pop() as Type<any>;

        while (condition.getValue()) {
            node.body.accept(this, { frame });
            node.expression.accept(this, { frame });

            if (frame.break_flag) {
                frame.break_flag = false;
                break;
            }

            if (frame.continue_flag) {
                frame.continue_flag = false;
                node.expression.accept(this, { frame });
                condition = frame.stack.pop() as Type<any>;
                continue;
            }

            if (frame.return_flag) {
                break;
            }

            condition = frame.stack.pop() as Type<any>;
        }
    }

    visitFor(
        node: ForNode,
        { frame }: { frame: Frame }
    ) {
        let condition: Type<any>;

        if (node.init) {
            node.init.accept(this, { frame });
        }

        if (node.condition) {
            node.condition.accept(this, { frame });
            condition = frame.stack.pop() as Type<any>;
        } else {
            condition = new BoolType(true);
        }

        while (condition.getValue()) {
            node.body.accept(this, { frame });

            if (frame.break_flag) {
                frame.break_flag = false;
                break;
            }

            if (frame.continue_flag) {
                frame.continue_flag = false;
                if (node.update)
                    node.update.accept(this, { frame });

                if (node.condition) {
                    node.condition.accept(this, { frame });
                    condition = frame.stack.pop() as Type<any>;
                }

                continue;
            }

            if (frame.return_flag) {
                break;
            }

            if (node.update)
                node.update.accept(this, { frame });

            if (node.condition) {
                node.condition.accept(this, { frame });
                condition = frame.stack.pop() as Type<any>;
            }
        }
    }

    visitVariableList(
        node: VariableListNode,
        args?: Record<string, any>
    ) {
        for (const n of node.variables) {
            n.accept(this, args);
        }
    }

    visitVariable(
        node: VariableNode,
        { frame }: { frame: Frame }
    ) {
        let value: Type<any> | null = null;

        if (node.expression) {
            node.expression.accept(this, { frame });
            value = frame.stack.pop() as Type<any>;
        }

        if (value?.getType() == "function") {
            set_symbol(
                (node.identifier as IdentifierNode).name,
                value.getValue(),
                frame
            );
        } else {
            const variable = new VariableNode(
                node.identifier,
                node.expression,
                value
            );

            set_symbol(
                (node.identifier as IdentifierNode).name,
                variable,
                frame
            );
        }
    }

    visitBinaryOp(
        node: BinaryOpNode,
        { frame }: { frame: Frame }
    ) {
        node.left.accept(this, { frame });
        const left = frame.stack.pop();
        if (!left) throw new Error("Stack underflow - left operand");

        node.right.accept(this, { frame });
        const right = frame.stack.pop();
        if (!right) throw new Error("Stack underflow - right operand");

        let result: Type<any>;
        switch (node.operator) {
            case "+":
                result = left.add(right);
                break;
            case "-":
                result = left.minus(right);
                break;
            case "*":
                result = left.multiply(right);
                break;
            case "/":
                result = left.divide(right);
                break;
            case "%":
                result = left.modulo(right);
                break;
            case "<":
                result = left.lt(right);
                break;
            case ">":
                result = left.gt(right);
                break;
            case "==":
                result = left.eq(right);
                break;
            case "!=":
                result = left.neq(right);
                break;
            default:
                throw new Error(`Unsupported operator: ${node.operator}`);
        }

        frame.stack.push(result);
    }

    visitAssignmentExpression(
        node: BinaryOpNode,
        { frame }: { frame: Frame }
    ) {
        node.right.accept(this, { frame });
        let right = frame.stack.pop() as Type<any>;

        const apply_operator = (left_value: Type<any>, operator: string, right_value: Type<any>) => {
            switch (operator) {
                case "=":
                    return right_value;
                case "+=":
                    return left_value.add(right_value);
                case "-=":
                    return left_value.minus(right_value);
                case "*=":
                    return left_value.multiply(right_value);
                case "/=":
                    return left_value.divide(right_value);
                case "%=":
                    return left_value.modulo(right_value);
                default:
                    throw new Error(`Unsupported operator: ${operator}`);
            }
        };

        const handle_member_expression = (memberExpr: MemberExpressionNode) => {

            memberExpr.object.accept(this, { frame });
            const objectValue = frame.stack.pop() as Type<any>;

            let propertyValue: Type<any> | null = null;
            if (memberExpr.computed) {
                memberExpr.property.accept(this, { frame });
                propertyValue = frame.stack.pop() as Type<any>;
            } else {

                const propertyName = (memberExpr.property as IdentifierNode).name;
                propertyValue = new StringType(propertyName);
            }


            const currentPropertyValue = objectValue.get(propertyValue);
            if (currentPropertyValue) {
                const result = apply_operator(currentPropertyValue, node.operator, right);

                objectValue.set(propertyValue, result);
            }

        };

        if (node.left.type == "Identifier") {
            const name = (node.left as IdentifierNode).name;
            const prev = lookup_symbol(name, frame) as VariableNode;

            prev.value = apply_operator(prev.value, node.operator, right);
        } else if (node.left.type === "MemberExpression") {

            const memberExpr = node.left as MemberExpressionNode;
            handle_member_expression(memberExpr);
        }
    }

    visitIdentifier(
        node: IdentifierNode,
        { frame }: { frame: Frame }
    ) {
        const o = lookup_symbol(node.name, frame);

        if (!o) {
            throw new Error(`Variable '${node.name}' is not defined`);
        }

        if (o instanceof VariableNode) {
            frame.stack.push((o as VariableNode).value);
        } else if (o instanceof ParameterNode) {
            frame.stack.push((o as ParameterNode).value);
        } else {
            frame.stack.push(new FunctionType(o as FunctionDecNode));
        }
    }

    visitArray(node: ArrayNode, { frame }: { frame: Frame }) {
        frame.stack.push(new ArrayType(node.elements.map(n => {
            n.accept(this, { frame })
            return frame.stack.pop() as Type<any>;
        })));
    }

    visitObject(
        node: ObjectNode,
        { frame }: { frame: Frame }
    ) {
        const objectProperties = node.properties.reduce((acc, propNode) => {
            propNode.value.accept(this, { frame })
            const value = frame.stack.pop() as Type<any>;

            let key: string = propNode.key;

            acc[key] = value;

            return acc;
        }, {} as Record<string, Type<any>>);

        frame.stack.push(new DictType(objectProperties));
    }

    visitStructDef(
        node: StructDefNode,
        { frame }: { frame: Frame }
    ) {
        node.object.accept(this, { frame });
        const struct = frame.stack.pop() as Type<DictType>;

        if (struct) {
            struct.type = node.name;
            frame.stack.push(struct);
        }
    }

    visitString(
        node: StringNode,
        { frame }: { frame: Frame }
    ) {
        frame.stack.push(new StringType(node.value));
    }

    visitNumber(
        node: NumberNode,
        { frame }: { frame: Frame }
    ) {
        frame.stack.push(new NumberType(node.value));
    }
}