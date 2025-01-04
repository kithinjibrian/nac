export class Task {
    constructor(
        public fn: Function,
        public context: any,
        public args: any[] = [],
        public callbacks: Function[] = []
    ) {
    }

    execute() {
        const result = this.fn.apply(this.context, this.args);
        this.callbacks.forEach(callback => callback(result));
    }

    then(callback: Function) {
        this.callbacks.push(callback);
        return this;
    }
}