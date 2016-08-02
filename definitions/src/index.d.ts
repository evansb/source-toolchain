/// <reference path="../../typings/index.d.ts" />
/// <reference path="../../typeshims/jshint.d.ts" />
/// <reference path="../../typeshims/estraverse.d.ts" />
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/concat';
import { Snapshot, ISnapshotError } from './toolchain/common';
export interface IRequest {
    code: string;
    week: number;
    timeout?: number;
    context?: any;
    parent?: Snapshot;
    globals?: {
        [name: string]: any;
    };
    maxCallStack?: number;
}
export declare type ISink = Observable<Snapshot | ISnapshotError>;
export declare function createRequestStream(request: (observer: Observer<IRequest>) => any): Observable<IRequest>;
export declare function createServer(request$: Observable<IRequest>): ISink;
import * as common from './toolchain/common';
export { common };
