import axios from "axios"
import { Builtin } from "./phases/phases"
import * as ivm from 'isolated-vm';

const httpStrategy: Record<string, any> = {
    GET: async (config: any) => await axios.get(config.url, config),
    POST: async (config: any) => await axios.post(config.url, config.data, config),
    PUT: async (config: any) => await axios.put(config.url, config.data, config),
    PATCH: async (config: any) => await axios.patch(config.url, config.data, config),
    DELETE: async (config: any) => await axios.delete(config.url, config)
};

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
    },
    fetch_inbuilt: {
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
}