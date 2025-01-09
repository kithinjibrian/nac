import { Builtin } from "./phases/phases"

export const builtin: Record<string, Builtin> = {
    print: {
        type: "function",
        signature: "<T>(args: T) -> integer",
        exec: (...args: any[]) => {
            console.log(...args)
        }
    },
    fetchJS: {
        type: "function",
        signature: "<T, U>(url: string, opts: T) -> U",
        exec: () => {

        }
    }
}