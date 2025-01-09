import { Builtin } from "./phases/phases";
export declare const builtin: Record<string, Builtin>;
/**
 * fetch_inbuilt: {
        type: "function",
        async: true,
        signature: "<T, U>(url: string, opts: T) -> Promise<U>",
        exec: async (...args: any[]) => {
            const url = args[0];
            const { method, ...rest } = args[1];
            try {
                const response = await httpStrategy[method]({
                    url,
                    ...rest
                });

                return new ivm.ExternalCopy({
                    tag: "Ok",
                    data: {
                        status: response.status,
                        headers: response.headers,
                        data: response.data
                    }
                }).copyInto();

            } catch (e: any) {
                if (e.response) {
                    return new ivm.ExternalCopy({
                        tag: "Err",
                        data: {
                            status: e.response.status,
                            headers: e.response.headers,
                            data: e.response.data,
                        }
                    }).copyInto()
                }
                return new ivm.ExternalCopy({
                    tag: "Err",
                    data: e.message
                }).copyInto()
            }
        }
    }
 *
 */ 
//# sourceMappingURL=builtin.d.ts.map