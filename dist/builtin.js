"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.builtin = void 0;
const axios_1 = require("axios");
exports.builtin = {
    print: {
        type: "function",
        signature: "<T>(args: T) -> integer",
        filter: (args) => {
            return args.map(i => i.str());
        },
        exec: (args) => {
            console.log(args.join(" "));
        }
    },
    fetch: {
        type: "function",
        async: true,
        signature: "<T>(args: T) -> integer",
        filter: (args) => {
            return args.map(i => i.str());
        },
        exec: (args) => {
            axios_1.default.get("https://api.dafifi.net")
                .then(res => {
                console.log(res.data);
            });
            return 90;
        }
    }
};
