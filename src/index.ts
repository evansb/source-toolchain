/// <reference path='../typings/index.d.ts' />
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/timeout'
import 'rxjs/add/observable/of'
import 'rxjs/add/observable/concat'
import { Snapshot$, Error$, Snapshot } from './toolchain/common'
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
  globals?: {[name: string]: any}
  maxCallStack?: number
}

export interface ISink {
  snapshot$: Snapshot$,
  error$: Error$
}

export function createContext(request$: Observable<IRequest>): ISink {
  const snapshot$ = request$.map((request) => (new Snapshot({
    week: request.week,
    code: request.code,
    timeout: request.timeout || DEFAULT_TIMEOUT,
    maxCallStack: request.maxCallStack
  })))
  const linterSink = createLinter(snapshot$)
  const parserSink = createParser(linterSink.snapshot$)
  const evalSink = createEvaluator(parserSink.snapshot$)
  return {
    snapshot$: evalSink.snapshot$,
    error$: Observable.concat(linterSink.error$, parserSink.error$, evalSink.error$)
  }
}

import * as common from './toolchain/common'
export { common }
