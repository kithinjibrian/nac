"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Type = void 0;
class Type {
    constructor(type, value, operations) {
        this.type = type;
        this.value = value;
        this.operations = operations;
    }
    getType() {
        if (this.operations.getType) {
            return this.operations.getType();
        }
        return this.type;
    }
    getValue() {
        if (this.operations.getValue) {
            return this.operations.getValue();
        }
        return this.value;
    }
    str(indentLevel) {
        if (this.operations.str) {
            return this.operations.str(indentLevel);
        }
        return JSON.stringify(this.value, null, 2);
    }
    get(obj) {
        if (this.operations.get) {
            return this.operations.get(obj);
        }
        throw new Error(`Operation 'get' not supported for type ${this.type}`);
    }
    set(index, new_value) {
        if (this.operations.set) {
            return this.operations.set(index, new_value);
        }
        throw new Error(`Operation 'set' not supported for type ${this.type}`);
    }
    add(obj) {
        if (this.operations.add) {
            return this.operations.add(obj);
        }
        throw new Error(`Operation 'add' not supported for type ${this.type}`);
    }
    minus(obj) {
        if (this.operations.minus) {
            return this.operations.minus(obj);
        }
        throw new Error(`Operation 'minus' not supported for type ${this.type}`);
    }
    multiply(obj) {
        if (this.operations.multiply) {
            return this.operations.multiply(obj);
        }
        throw new Error(`Operation 'multiply' not supported for type ${this.type}`);
    }
    divide(obj) {
        if (this.operations.divide) {
            return this.operations.divide(obj);
        }
        throw new Error(`Operation 'divide' not supported for type ${this.type}`);
    }
    modulo(obj) {
        if (this.operations.modulo) {
            return this.operations.modulo(obj);
        }
        throw new Error(`Operation 'modulo' not supported for type ${this.type}`);
    }
    lt(obj) {
        if (this.operations.lt) {
            return this.operations.lt(obj);
        }
        throw new Error(`Operation 'lt' not supported for type ${this.type}`);
    }
    gt(obj) {
        if (this.operations.gt) {
            return this.operations.gt(obj);
        }
        throw new Error(`Operation 'gt' not supported for type ${this.type}`);
    }
    eq(obj) {
        if (this.operations.eq) {
            return this.operations.eq(obj);
        }
        throw new Error(`Operation 'eq' not supported for type ${this.type}`);
    }
    neq(obj) {
        if (this.operations.neq) {
            return this.operations.neq(obj);
        }
        throw new Error(`Operation 'neq' not supported for type ${this.type}`);
    }
    inc() {
        if (this.operations.inc) {
            return this.operations.inc();
        }
        throw new Error(`Operation 'inc' not supported for type ${this.type}`);
    }
    dec() {
        if (this.operations.dec) {
            return this.operations.dec();
        }
        throw new Error(`Operation 'dec' not supported for type ${this.type}`);
    }
}
exports.Type = Type;
