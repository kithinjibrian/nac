export interface Frame {
    stack: any[];
    break_flag: boolean;
    return_flag: boolean;
    continue_flag: boolean;
    symbol_table: Map<string, any>;
    return_value: any;
    parent: Frame | null;
}
export declare function new_frame(old: Frame | null): Frame;
export declare function lookup_symbol(name: string, frame: Frame): any;
export declare function set_symbol(name: string, value: any, frame: Frame): void;
export declare function update_symbol(name: string, value: any, frame: Frame): void;
//# sourceMappingURL=symtab.d.ts.map