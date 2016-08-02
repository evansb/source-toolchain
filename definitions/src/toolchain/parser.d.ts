/// <reference path="../../../typeshims/estraverse.d.ts" />
import { Observer } from 'rxjs/Observer';
import { ISnapshotError, Error$, ISink } from './common';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/filter';
import 'rxjs/add/observable/concat';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeAll';
export declare function sanitizeFeatures(observer: Observer<ISnapshotError>, node: ESTree.Node, week: number): void;
export declare function sanitize(ast: ESTree.Program, week: number): Error$;
export declare function parse(code: string): ESTree.Program | SyntaxError;
export declare function createParser(snapshot$: ISink, week?: number): ISink;
