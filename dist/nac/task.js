"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
class Task {
    constructor(fn, context, args = [], callbacks = []) {
        this.fn = fn;
        this.context = context;
        this.args = args;
        this.callbacks = callbacks;
    }
    execute() {
        const result = this.fn.apply(this.context, this.args);
        this.callbacks.forEach(callback => callback(result));
    }
    then(callback) {
        this.callbacks.push(callback);
        return this;
    }
}
exports.Task = Task;
