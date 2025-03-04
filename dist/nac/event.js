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
exports.EventLoop = void 0;
class EventLoop {
    constructor(taskQueue = [], microtaskQueue = [], isRunning = false) {
        this.taskQueue = taskQueue;
        this.microtaskQueue = microtaskQueue;
        this.isRunning = isRunning;
    }
    enqueue(task) {
        this.taskQueue.push(task);
        if (!this.isRunning) {
            this.run();
        }
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            this.isRunning = true;
            try {
                while (this.hasWork()) {
                    while (this.microtaskQueue.length > 0) {
                        const microtask = this.microtaskQueue.shift();
                        microtask.execute();
                    }
                    if (this.taskQueue.length > 0) {
                        const task = this.taskQueue.shift();
                        task.execute();
                    }
                    yield new Promise(resolve => setTimeout(resolve, 0));
                }
            }
            finally {
                this.isRunning = false;
            }
        });
    }
    hasWork() {
        return (this.taskQueue.length > 0 ||
            this.microtaskQueue.length > 0);
    }
}
exports.EventLoop = EventLoop;
