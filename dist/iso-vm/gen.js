"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ISOVM = void 0;
const before_accept = {
    "FunctionDec": (node, visitor, args) => {
        if (args) {
            if ('main' in args && node.identifier == args.main)
                args.in_main = true;
        }
    }
};
const after_accept = {
    "FunctionDec": (node, visitor, args) => {
        if (args) {
            if ('main' in args && node.identifier == args.main)
                args.in_main = false;
        }
    }
};
const handle_node = {
    "Return": (node, visitor, args) => {
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
};
class ISOVM {
    constructor() {
        this.name = "isolate-vm";
    }
    beforeAccept(node, visitor, args) {
        var _a;
        (_a = before_accept[node.type]) === null || _a === void 0 ? void 0 : _a.call(before_accept, node, visitor, args);
    }
    afterAccept(node, visitor, args) {
        var _a;
        (_a = after_accept[node.type]) === null || _a === void 0 ? void 0 : _a.call(after_accept, node, visitor, args);
    }
    handleNode(node, visitor, args) {
        var _a;
        return (_a = handle_node[node.type]) === null || _a === void 0 ? void 0 : _a.call(handle_node, node, visitor, args);
    }
}
exports.ISOVM = ISOVM;
