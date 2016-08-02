export declare function lint(code: string): void;
export declare function parse(code: string, week?: number): void;
export declare function run(code: string, value: any, context?: {
    [name: string]: any;
}, isNegative?: boolean): void;
