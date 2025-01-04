export declare class Task {
    fn: Function;
    context: any;
    args: any[];
    callbacks: Function[];
    constructor(fn: Function, context: any, args?: any[], callbacks?: Function[]);
    execute(): void;
    then(callback: Function): this;
}
//# sourceMappingURL=task.d.ts.map