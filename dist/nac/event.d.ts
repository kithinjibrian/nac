import { Task } from "./task";
export declare class EventLoop {
    taskQueue: Task[];
    private microtaskQueue;
    isRunning: boolean;
    constructor(taskQueue?: Task[], microtaskQueue?: Task[], isRunning?: boolean);
    enqueue(task: Task): void;
    run(): Promise<void>;
    private hasWork;
}
//# sourceMappingURL=event.d.ts.map