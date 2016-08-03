/// <reference path='../typings/index.d.ts' />
/// <reference path='../typeshims/jshint.d.ts' />
/// <reference path='../typeshims/estraverse.d.ts' />
import { Observable } from 'rxjs/Observable'
import { Observer } from 'rxjs/Observer'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/timeout'
import 'rxjs/add/observable/of'
import 'rxjs/add/observable/concat'
import { Snapshot, ISnapshotError } from './toolchain/common'
import { createLinter } from './toolchain/linter'
import { createParser } from './toolchain/parser'
import { createEvaluator } from './toolchain/interpreter-legacy'

const DEFAULT_TIMEOUT = 10000

export interface IRequest {
  code: string
  week: number
  timeout?: number
  context?: any
  parent?: Snapshot
  globals?: string[]
  maxCallStack?: number
}

export type ISink = Observable<Snapshot | ISnapshotError>

export function createRequestStream(request: (observer: Observer<IRequest>) => any): Observable<IRequest> {
  return Observable.create(request)
}

export function createServer(request$: Observable<IRequest>): ISink {
  const snapshot$ = request$.map((request) => (new Snapshot({
    week: request.week,
    parent: request.parent,
    code: request.code,
    context: request.context,
    globals: request.globals,
    timeout: request.timeout || DEFAULT_TIMEOUT,
    maxCallStack: request.maxCallStack
  })))
  const linterSink = createLinter(snapshot$)
  const parserSink = createParser(linterSink)
  const evalSink = createEvaluator(parserSink)
  return evalSink
}

export { Snapshot, ISnapshotError, Any, Never, Undefined, box, unbox } from './toolchain/common'

export { printValueToString, printErrorToString } from './toolchain/printer'
