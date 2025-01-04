"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = void 0;
const ast_1 = require("../parser/ast");
const array_1 = require("../objects/array");
const bool_1 = require("../objects/bool");
const create_1 = require("../objects/create");
const dict_1 = require("../objects/dict");
const function_1 = require("../objects/function");
const number_1 = require("../objects/number");
const string_1 = require("../objects/string");
const symtab_1 = require("../dsa/symtab");
const event_1 = require("./event");
const task_1 = require("./task");
class Interpreter {
    constructor() {
        this.eventLoop = new event_1.EventLoop();
        this.builtin = {};
        this.global = (0, symtab_1.new_frame)(null);
    }
    insert(builtin, symbol_table) {
        this.builtin = builtin;
        Object.entries(builtin)
            .map(([key, value]) => {
            if (value.type == "function") {
                const inbuiltFunction = new ast_1.FunctionDecNode(key, undefined, new ast_1.BlockNode([]), true);
                symbol_table.set(key, inbuiltFunction);
            }
            else if (value.type == "variable") {
                const inbuiltVariable = new ast_1.VariableNode(new ast_1.IdentifierNode(key), undefined, (0, create_1.create_object)(value.value));
                symbol_table.set(key, inbuiltVariable);
            }
        });
    }
    run(ast, builtin) {
        this.insert(builtin, this.global.symbol_table);
        this.scheduleTask(ast, this.global, () => { });
    }
    scheduleTask(node, frame, callback) {
        const task = new task_1.Task((frame) => {
            try {
                node.accept(this, { frame });
                if (frame.return_flag)
                    return frame.return_value;
            }
            catch (e) {
                console.log(e);
            }
        }, this, [frame], [callback]);
        this.eventLoop.enqueue(task);
    }
    execute_function(fn, args, frame) {
        return __awaiter(this, void 0, void 0, function* () {
            const nf = (0, symtab_1.new_frame)(frame);
            const evaluatedArgs = [];
            for (const arg of args) {
                arg.accept(this, { frame });
                const argValue = frame.stack.pop();
                if (!argValue)
                    throw new Error("Stack underflow - argument evaluation");
                evaluatedArgs.push(argValue);
            }
            if (fn.params) {
                fn.params.parameters.forEach((param, i) => {
                    let _param = param;
                    (0, symtab_1.set_symbol)(_param.identifier.name, new ast_1.ParameterNode(_param.identifier, _param.variadic, _param.expression, i < evaluatedArgs.length ? evaluatedArgs[i] : undefined), nf);
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
                    : evaluatedArgs.map(i => i.getValue());
                let value;
                if (inbuilt.async) {
                    try {
                        value = yield inbuilt.exec(filtered);
                    }
                    catch (e) {
                        throw new Error(e.message);
                    }
                }
                else {
                    value = inbuilt.exec(filtered);
                }
                if (value) {
                    frame.stack.push((0, create_1.create_object)(value));
                }
            }
            else {
                if (fn.is_async) {
                    this.scheduleTask(fn.body, nf, (result) => {
                        if (result) {
                            frame.stack.push(nf.return_value);
                        }
                    });
                }
                else {
                    fn.body.accept(this, { frame: nf });
                    if (nf.return_value)
                        frame.stack.push(nf.return_value);
                }
            }
        });
    }
    before_accept(node) {
        //  console.log(node.type);
    }
    visitSourceElements(node, args) {
        for (const n of node.sources) {
            n.accept(this, args);
        }
    }
    visitExpressionStatement(node, args) {
        node.expression.accept(this, args);
    }
    visitFunctionDec(node, { frame }) {
        (0, symtab_1.set_symbol)(node.identifier, node, frame);
    }
    visitCallExpression(node, { frame }) {
        if (node.callee instanceof ast_1.IdentifierNode) {
            const fn = (0, symtab_1.lookup_symbol)(node.callee.name, frame);
            if (!fn) {
                throw new Error(`Function ${node.callee.name} is not defined`);
            }
            this.execute_function(fn, node.args, frame);
        }
        else {
            node.callee.accept(this, { frame });
            const fn = frame.stack.pop();
            this.execute_function(fn.getValue(), node.args, frame);
        }
    }
    visitMemberExpression(node, { frame }) {
        node.object.accept(this, { frame });
        const object = frame.stack.pop();
        let propertyValue;
        if (node.computed) {
            node.property.accept(this, { frame });
            propertyValue = frame.stack.pop();
        }
        else {
            propertyValue = new string_1.StringType(node.property.name);
        }
        const value = object.get(propertyValue);
        if (!value) {
            throw new Error("Property not found");
        }
        frame.stack.push(value);
    }
    visitBlock(node, { frame }) {
        const nf = (0, symtab_1.new_frame)(frame);
        for (const n of node.body) {
            n.accept(this, { frame: nf });
            if (nf.return_flag ||
                nf.break_flag ||
                nf.continue_flag) {
                break;
            }
        }
        frame.continue_flag = nf.continue_flag;
        frame.break_flag = nf.break_flag;
        frame.return_flag = nf.return_flag;
        frame.return_value = nf.return_value;
    }
    visitReturn(node, { frame }) {
        if (node.expression) {
            node.expression.accept(this, { frame });
            frame.return_value = frame.stack.pop();
        }
        frame.return_flag = true;
    }
    visitBreak(node, { frame }) {
        frame.break_flag = true;
    }
    visitContinue(node, { frame }) {
        frame.continue_flag = true;
    }
    visitIfElse(node, { frame }) {
        node.condition.accept(this, { frame });
        let condition = frame.stack.pop();
        if (condition.getValue()) {
            node.consequent.accept(this, { frame });
        }
        else {
            if (node.alternate) {
                node.alternate.accept(this, { frame });
            }
        }
    }
    visitWhile(node, { frame }) {
        node.expression.accept(this, { frame });
        let condition = frame.stack.pop();
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
                condition = frame.stack.pop();
                continue;
            }
            if (frame.return_flag) {
                break;
            }
            condition = frame.stack.pop();
        }
    }
    visitFor(node, { frame }) {
        let condition;
        if (node.init) {
            node.init.accept(this, { frame });
        }
        if (node.condition) {
            node.condition.accept(this, { frame });
            condition = frame.stack.pop();
        }
        else {
            condition = new bool_1.BoolType(true);
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
                    condition = frame.stack.pop();
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
                condition = frame.stack.pop();
            }
        }
    }
    visitVariableList(node, args) {
        for (const n of node.variables) {
            n.accept(this, args);
        }
    }
    visitVariable(node, { frame }) {
        let value = null;
        if (node.expression) {
            node.expression.accept(this, { frame });
            value = frame.stack.pop();
        }
        if ((value === null || value === void 0 ? void 0 : value.getType()) == "function") {
            (0, symtab_1.set_symbol)(node.identifier.name, value.getValue(), frame);
        }
        else {
            const variable = new ast_1.VariableNode(node.identifier, node.expression, value);
            (0, symtab_1.set_symbol)(node.identifier.name, variable, frame);
        }
    }
    visitBinaryOp(node, { frame }) {
        node.left.accept(this, { frame });
        const left = frame.stack.pop();
        if (!left)
            throw new Error("Stack underflow - left operand");
        node.right.accept(this, { frame });
        const right = frame.stack.pop();
        if (!right)
            throw new Error("Stack underflow - right operand");
        let result;
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
    visitAssignmentExpression(node, { frame }) {
        node.right.accept(this, { frame });
        let right = frame.stack.pop();
        const apply_operator = (left_value, operator, right_value) => {
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
        const handle_member_expression = (memberExpr) => {
            memberExpr.object.accept(this, { frame });
            const objectValue = frame.stack.pop();
            let propertyValue = null;
            if (memberExpr.computed) {
                memberExpr.property.accept(this, { frame });
                propertyValue = frame.stack.pop();
            }
            else {
                const propertyName = memberExpr.property.name;
                propertyValue = new string_1.StringType(propertyName);
            }
            const currentPropertyValue = objectValue.get(propertyValue);
            if (currentPropertyValue) {
                const result = apply_operator(currentPropertyValue, node.operator, right);
                objectValue.set(propertyValue, result);
            }
        };
        if (node.left.type == "Identifier") {
            const name = node.left.name;
            const prev = (0, symtab_1.lookup_symbol)(name, frame);
            prev.value = apply_operator(prev.value, node.operator, right);
        }
        else if (node.left.type === "MemberExpression") {
            const memberExpr = node.left;
            handle_member_expression(memberExpr);
        }
    }
    visitIdentifier(node, { frame }) {
        const o = (0, symtab_1.lookup_symbol)(node.name, frame);
        if (!o) {
            throw new Error(`Variable '${node.name}' is not defined`);
        }
        if (o instanceof ast_1.VariableNode) {
            frame.stack.push(o.value);
        }
        else if (o instanceof ast_1.ParameterNode) {
            frame.stack.push(o.value);
        }
        else {
            frame.stack.push(new function_1.FunctionType(o));
        }
    }
    visitArray(node, { frame }) {
        frame.stack.push(new array_1.ArrayType(node.elements.map(n => {
            n.accept(this, { frame });
            return frame.stack.pop();
        })));
    }
    visitObject(node, { frame }) {
        const objectProperties = node.properties.reduce((acc, propNode) => {
            propNode.value.accept(this, { frame });
            const value = frame.stack.pop();
            let key = propNode.key;
            acc[key] = value;
            return acc;
        }, {});
        frame.stack.push(new dict_1.DictType(objectProperties));
    }
    visitStructDef(node, { frame }) {
        node.object.accept(this, { frame });
        const struct = frame.stack.pop();
        if (struct) {
            struct.type = node.name;
            frame.stack.push(struct);
        }
    }
    visitString(node, { frame }) {
        frame.stack.push(new string_1.StringType(node.value));
    }
    visitNumber(node, { frame }) {
        frame.stack.push(new number_1.NumberType(node.value));
    }
}
exports.Interpreter = Interpreter;
