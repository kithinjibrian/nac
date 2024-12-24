import { ArrayNode, ASTNode, BinaryOpNode, BlockNode, CallExpressionNode, ExpressionStatementNode, ForNode, FunctionDecNode, IdentifierNode, IfElseNode, MemberExpressionNode, NumberNode, ObjectNode, ParameterNode, PostfixExpressionNode, ReturnNode, SourceElementsNode, StringNode, VariableListNode, VariableNode, WhileNode } from "./ast";
import { ArrayType } from "./objects/array";
import { Type } from "./objects/base";
import { BoolType } from "./objects/bool";
import { FunctionType } from "./objects/function";
import { NumberType } from "./objects/number";
import { DictType } from "./objects/dict";
import { StringType } from "./objects/string";

export interface Frame {
    stack: Type<any>[];
    break_flag: boolean;
    return_flag: boolean;
    continue_flag: boolean;
    symbol_table: Map<string, any>;
    return_value: Type<any> | null;
    parent: Frame | null;
}

export interface Builtin {
    async?: boolean;
    signature: string;
    filter?: Function;
    exec: Function
}

export class Interpreter {
    private inbuilt: Record<string, Builtin> = {};

    private lookup_symbol(name: string, frame: Frame): any {
        let currentFrame: Frame | null = frame;
        while (currentFrame) {
            if (currentFrame.symbol_table.has(name)) {
                return currentFrame.symbol_table.get(name);
            }
            currentFrame = currentFrame.parent;
        }
        return undefined;
    }

    private set_symbol(name: string, value: Type<any>, frame: Frame) {
        let currentFrame: Frame | null = frame;
        let node: VariableNode;
        while (currentFrame) {
            node = currentFrame.symbol_table.get(name);
            if (node) {
                node.value = value;
                return;
            }
            currentFrame = currentFrame.parent;
        }

    }

    public new_frame(old: Frame | null): Frame {
        return {
            stack: [],
            break_flag: false,
            return_flag: false,
            return_value: null,
            continue_flag: false,
            symbol_table: new Map(),
            parent: old
        };
    }

    constructor(node: ASTNode, inbuilt: Record<string, Builtin>) {
        this.inbuilt = inbuilt;
        const global = this.new_frame(null);

        Object.entries(inbuilt).map(([key, value]) => {
            const inbuiltFunction: FunctionDecNode = {
                type: 'FunctionDec',
                identifier: key,
                inbuilt: true,
                body: {
                    type: 'Block',
                    body: []
                } as BlockNode
            };

            global.symbol_table.set(key, inbuiltFunction);
        })

        this.eval(node, global);
    }

    public eval(node: ASTNode, frame: Frame) {
        const evalMap: { [key: string]: (node: any, frame: Frame) => any } = {
            "SourceElements": this.source_elements.bind(this),
            "While": this.while_statement.bind(this),
            "For": this.for_statement.bind(this),
            "IfElse": this.if_else_statement.bind(this),
            "ExpressionStatement": this.expression_statement.bind(this),
            "BinaryExpression": this.binary_expression.bind(this),
            "AssignmentExpression": this.assignment_expression.bind(this),
            "FunctionDec": this.function_dec.bind(this),
            "CallExpression": this.call_expression.bind(this),
            "MemberExpression": this.member_expression.bind(this),
            "Let": this.let.bind(this),
            "Variable": this.variable.bind(this),
            "Block": this.block.bind(this),
            "Return": this.return.bind(this),
            "Break": this.break.bind(this),
            "Continue": this.continue.bind(this),
            "Identifier": this.identifier.bind(this),
            "Number": this.number.bind(this),
            "String": this.string.bind(this),
            "Array": this.array.bind(this),
            "Object": this.object.bind(this),
        };

        const handler = evalMap[node.type];
        if (!handler) {
            throw new Error(`Unsupported node type: ${node.type}`);
        }

        return handler(node, frame);
    }

    private source_elements(node: SourceElementsNode, frame: Frame): void {
        for (const n of node.sources) {
            this.eval(n, frame);
        }
    }

    private while_statement(node: WhileNode, frame: Frame) {
        this.eval(node.expression, frame);
        let condition = frame.stack.pop() as Type<any>;

        while (condition.getValue()) {
            this.eval(node.body, frame);
            this.eval(node.expression, frame);

            if (frame.break_flag) {
                frame.break_flag = false;
                break;
            }

            if (frame.continue_flag) {
                frame.continue_flag = false;
                this.eval(node.expression, frame);
                condition = frame.stack.pop() as Type<any>;
                continue;
            }

            if (frame.return_flag) {
                break;
            }

            condition = frame.stack.pop() as Type<any>;
        }
    }

    private for_statement(node: ForNode, frame: Frame) {
        let condition: Type<any>;

        if (node.init) {
            this.eval(node.init, frame);
        }

        if (node.condition) {
            this.eval(node.condition, frame);
            condition = frame.stack.pop() as Type<any>;
        } else {
            condition = new BoolType(true);
        }

        while (condition.getValue()) {
            this.eval(node.body, frame);

            if (frame.break_flag) {
                frame.break_flag = false;
                break;
            }

            if (frame.continue_flag) {
                frame.continue_flag = false;
                if (node.update)
                    this.eval(node.update, frame);

                if (node.condition) {
                    this.eval(node.condition, frame);
                    condition = frame.stack.pop() as Type<any>;
                }

                continue;
            }

            if (frame.return_flag) {
                break;
            }

            if (node.update)
                this.eval(node.update, frame);

            if (node.condition) {
                this.eval(node.condition, frame);
                condition = frame.stack.pop() as Type<any>;
            }
        }
    }

    private if_else_statement(node: IfElseNode, frame: Frame) {
        this.eval(node.condition, frame);
        let condition = frame.stack.pop() as Type<any>;

        if (condition.getValue()) {
            this.eval(node.consequent, frame);
        } else {
            if (node.alternate) {
                this.eval(node.alternate, frame);
            }
        }
    }

    private expression_statement(node: ExpressionStatementNode, frame: Frame) {
        this.eval(node.expression, frame);
    }

    private assignment_expression(node: BinaryOpNode, frame: Frame) {
        this.eval(node.right, frame);
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

            this.eval(memberExpr.object, frame);
            const objectValue = frame.stack.pop() as Type<any>;

            let propertyValue: Type<any> | null = null;
            if (memberExpr.computed) {
                this.eval(memberExpr.property, frame);
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
            const prev = this.lookup_symbol(name, frame) as VariableNode;

            const result = apply_operator(prev.value, node.operator, right);


            this.set_symbol(name, result, frame);
        } else if (node.left.type === "MemberExpression") {

            const memberExpr = node.left as MemberExpressionNode;
            handle_member_expression(memberExpr);
        }
    }

    private binary_expression(node: BinaryOpNode, frame: Frame): void {
        this.eval(node.left, frame);
        const left = frame.stack.pop();
        if (!left) throw new Error("Stack underflow - left operand");

        this.eval(node.right, frame);
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

    private let(node: VariableListNode, frame: Frame) {
        for (const n of node.variables) {
            this.eval(n, frame);
        }
    }

    private variable(node: VariableNode, frame: Frame) {
        let value: Type<any> | null = null;

        if (node.expression) {
            this.eval(node.expression, frame);
            value = frame.stack.pop() as Type<any>;
        }

        if (value?.getType() == "function") {
            frame.symbol_table.set((node.identifier as IdentifierNode).name, value.getValue());
        } else {
            const variable: VariableNode = {
                ...node,
                value
            }
            frame.symbol_table.set((node.identifier as IdentifierNode).name, variable);
        }

    }

    private function_dec(node: FunctionDecNode, frame: Frame) {
        frame.symbol_table.set(node.identifier, node);
    }

    private call_expression(node: CallExpressionNode, frame: Frame) {

        if (node.callee.type == "Identifier") {

            const fn = this.lookup_symbol((node.callee as IdentifierNode).name, frame) as FunctionDecNode;

            if (!fn) {
                throw new Error(`Function ${(node.callee as IdentifierNode).name} is not defined`);
            }

            this.execute_function(fn, node.arguments, frame);
        } else {
            this.eval(node.callee, frame);
            const fn = frame.stack.pop() as FunctionType;

            this.execute_function(fn.getValue(), node.arguments, frame);
        }
    }

    private async execute_function(
        fn: FunctionDecNode,
        args: ASTNode[],
        frame: Frame
    ) {
        const new_frame = this.new_frame(frame);

        const evaluatedArgs: Type<any>[] = [];
        for (const arg of args) {
            this.eval(arg, frame);
            const argValue = frame.stack.pop();
            if (!argValue) throw new Error("Stack underflow - argument evaluation");
            evaluatedArgs.push(argValue);
        }

        if (fn.params) {
            fn.params.parameters.forEach((param, i) => {
                new_frame.symbol_table.set(
                    (param as ParameterNode).identifier.name,
                    {
                        ...param,
                        value: i < evaluatedArgs.length ? evaluatedArgs[i] : undefined
                    }
                );
            });
        }


        if (fn.inbuilt) {
            const name = fn.identifier;
            const inbuilt = this.inbuilt[name];

            let value;
            if (inbuilt.async) {
                try {
                    value = await inbuilt.exec(
                        inbuilt.filter
                            ? inbuilt.filter(evaluatedArgs)
                            : evaluatedArgs.map(i => i.getValue())
                    )
                } catch (e: any) {
                    throw new Error(e.message);
                }
            } else {
                value = inbuilt.exec(
                    inbuilt.filter
                        ? inbuilt.filter(evaluatedArgs)
                        : evaluatedArgs.map(i => i.getValue())
                )
            }


            if (value) {
                frame.stack.push(new NumberType(value));
            }

        } else {
            this.eval(fn.body, new_frame);
        }

        if (new_frame.return_value)
            frame.stack.push(new_frame.return_value)
    }

    private member_expression(node: MemberExpressionNode, frame: Frame) {
        this.eval(node.object, frame);
        const object = frame.stack.pop() as Type<any>;

        let propertyValue: Type<any>;
        if (node.computed) {
            this.eval(node.property, frame);
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

    private block(node: BlockNode, frame: Frame) {
        const new_frame = this.new_frame(frame);

        for (const n of node.body) {
            this.eval(n, new_frame);
            if (new_frame.return_flag || new_frame.break_flag || new_frame.continue_flag) {
                break;
            }
        }

        frame.continue_flag = new_frame.continue_flag;
        frame.break_flag = new_frame.break_flag;
        frame.return_flag = new_frame.return_flag;
        frame.return_value = new_frame.return_value;

    }

    private return(node: ReturnNode, frame: Frame) {
        if (node.expression) {
            this.eval(node.expression, frame);
            frame.return_value = frame.stack.pop() as Type<any>;
        }
        frame.return_flag = true;
    }

    private break(node: ASTNode, frame: Frame) {
        frame.break_flag = true;
    }

    private continue(node: ASTNode, frame: Frame) {
        frame.continue_flag = true;
    }

    private identifier(node: IdentifierNode, frame: Frame): void {
        const n = this.lookup_symbol(node.name, frame) as ASTNode;

        if (!n) {
            throw new Error(`Variable '${node.name}' is not defined`);
        }

        if (n.type == "Variable") {
            frame.stack.push((n as VariableNode).value);
        }
        else if (n.type == "Parameter") {
            frame.stack.push((n as ParameterNode).value);
        }
        else {
            frame.stack.push(new FunctionType(n as FunctionDecNode));
        }
    }

    private number(node: NumberNode, frame: Frame): void {
        frame.stack.push(new NumberType(node.value));
    }

    private string(node: StringNode, frame: Frame): void {
        frame.stack.push(new StringType(node.value));
    }

    private array(node: ArrayNode, frame: Frame): void {
        frame.stack.push(new ArrayType(node.elements.map(n => {
            this.eval(n, frame);
            return frame.stack.pop() as Type<any>;
        })));
    }

    private object(node: ObjectNode, frame: Frame): void {
        const objectProperties = node.properties.reduce((acc, propNode) => {
            this.eval(propNode.value, frame);
            const value = frame.stack.pop() as Type<any>;

            let key: string;
            if (propNode.key.type == "Identifier")
                key = (propNode.key as IdentifierNode).name;
            else if (propNode.key.type == "String")
                key = (propNode.key as StringNode).value;
            else
                throw new Error("Unexpected key type");

            acc[key] = value;

            return acc;
        }, {} as Record<string, Type<any>>);

        frame.stack.push(new DictType(objectProperties));
    }
}