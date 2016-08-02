import { Observable } from 'rxjs/Observable';
export declare const Never: {
    type: string;
    value: symbol;
};
export declare const Undefined: {
    type: string;
    value: symbol;
};
export declare type Any = {
    type: string;
    id?: string;
    value?: any;
};
export declare function isForeign(value: Any): boolean;
export declare function isNever(value: Any): boolean;
export declare function isUndefined(value: Any): boolean;
export declare function isTruthy(value: Any): boolean;
export declare function box(value: any, type?: string): Any;
export declare function unbox(value: Any, context: any): any;
export declare class Snapshot {
    id: string;
    week: number;
    ast: ESTree.Program;
    environment: Array<Map<string, Any>>;
    done: boolean;
    node: ESTree.Node;
    valueType: string;
    value: Any;
    context: any;
    startTime: Date;
    callStack: Array<ESTree.CallExpression>;
    maxCallStack: number;
    timeout: number;
    currentNode: ESTree.Node;
    private _code;
    private _lines;
    constructor(fields: {
        code?: string;
        ast?: ESTree.Program;
        id?: string;
        week?: number;
        context?: any;
        timeout?: number;
        maxCallStack?: number;
    });
    initialEnvironment(): Map<any, any>;
    code: string;
    readonly lines: string[];
    getVar(name: string): Any;
    setVar(name: string, value: Any): Map<string, {
        type: string;
        id?: string;
        value?: any;
    }>;
}
export interface ISnapshotError {
    from: string;
    snapshot?: Snapshot;
    line?: number;
    endLine?: number;
    column?: number;
    endColumn?: number;
    message: string;
}
export declare type Snapshot$ = Observable<Snapshot>;
export declare type Error$ = Observable<ISnapshotError>;
export declare type ISink = Observable<Snapshot | ISnapshotError>;
export declare function createError(from: string, node: ESTree.Node, message: string): ISnapshotError;
