export interface Frame {
    stack: any[];
    break_flag: boolean;
    return_flag: boolean;
    continue_flag: boolean;
    symbol_table: Map<string, any>;
    return_value: any;
    parent: Frame | null;
}

export function new_frame(old: Frame | null): Frame {
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

export function lookup_symbol(name: string, frame: Frame): any {
    let currentFrame: Frame | null = frame;
    while (currentFrame) {
        if (currentFrame.symbol_table.has(name)) {
            return currentFrame.symbol_table.get(name);
        }
        currentFrame = currentFrame.parent;
    }
    return undefined;
}

export function set_symbol(name: string, value: any, frame: Frame) {
    frame.symbol_table.set(name, value);
}

export function update_symbol(name: string, value: any, frame: Frame) {
    let currentFrame: Frame | null = frame;
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