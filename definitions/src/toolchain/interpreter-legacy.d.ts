import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import { Any, Snapshot, ISink } from './common';
import T = ESTree;
export declare class EvaluationError extends Error {
    node: T.Node;
    message: string;
    constructor(node: T.Node, message: string);
}
export declare function init(snapshot: Snapshot, globals: string[]): void;
export declare function evaluate(node: T.Node, snapshot: Snapshot): Any;
export declare function createEvaluator(snapshot$: ISink): ISink;
