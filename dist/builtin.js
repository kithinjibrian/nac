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
exports.builtin = void 0;
const axios_1 = require("axios");
const httpStrategy = {
    GET: (config) => __awaiter(void 0, void 0, void 0, function* () { return yield axios_1.default.get(config.url, config); }),
    POST: (config) => __awaiter(void 0, void 0, void 0, function* () { return yield axios_1.default.post(config.url, config.data, config); }),
    PUT: (config) => __awaiter(void 0, void 0, void 0, function* () { return yield axios_1.default.put(config.url, config.data, config); }),
    PATCH: (config) => __awaiter(void 0, void 0, void 0, function* () { return yield axios_1.default.patch(config.url, config.data, config); }),
    DELETE: (config) => __awaiter(void 0, void 0, void 0, function* () { return yield axios_1.default.delete(config.url, config); })
};
exports.builtin = {
    print: {
        type: "function",
        signature: "<T>(args: T) -> integer",
        exec: (...args) => {
            console.log(...args);
        }
    },
    fetchJS: {
        type: "function",
        signature: "<T, U>(url: string, opts: T) -> U",
        exec: () => {
        }
    }
};
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
