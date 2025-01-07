import { Task } from "./task";

export class EventLoop {
    constructor(
        public taskQueue: Task[] = [],
        public microtaskQueue: Task[] = [],
        public isRunning: boolean = false
    ) { }

    enqueue(task: Task) {
        this.taskQueue.push(task);
        if (!this.isRunning) {
            this.run();
        }
    }

    async run() {
        this.isRunning = true;

        try {
            while (this.hasWork()) {
                while (this.microtaskQueue.length > 0) {
                    const microtask = this.microtaskQueue.shift()!;
                    microtask.execute();
                }

                if (this.taskQueue.length > 0) {
                    const task = this.taskQueue.shift()!;
                    task.execute();
                }

                await new Promise(resolve => setTimeout(resolve, 0));
            }
        } finally {
            this.isRunning = false;
        }
    }

    private hasWork(): boolean {
        return (
            this.taskQueue.length > 0 ||
            this.microtaskQueue.length > 0
        );
    }
}