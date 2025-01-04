"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.new_frame = new_frame;
exports.lookup_symbol = lookup_symbol;
exports.set_symbol = set_symbol;
exports.update_symbol = update_symbol;
function new_frame(old) {
    return {
        stack: [],
        break_flag: false,
        return_flag: false,
        return_value: null,
        continue_flag: false,
        symbol_table: new Map(),
        parent: old
    };
}
function lookup_symbol(name, frame) {
    let currentFrame = frame;
    while (currentFrame) {
        if (currentFrame.symbol_table.has(name)) {
            return currentFrame.symbol_table.get(name);
        }
        currentFrame = currentFrame.parent;
    }
    return undefined;
}
function set_symbol(name, value, frame) {
    frame.symbol_table.set(name, value);
}
function update_symbol(name, value, frame) {
    let currentFrame = frame;
    let node;
    while (currentFrame) {
        node = currentFrame.symbol_table.get(name);
        if (node) {
            node.value = value;
            return;
        }
        currentFrame = currentFrame.parent;
    }
}
