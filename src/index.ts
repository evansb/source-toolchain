/// <reference path='../typings/index.d.ts' />
import { Observable } from 'rxjs/Observable'
import { List } from 'immutable'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/timeout'
import 'rxjs/add/observable/of'
import 'rxjs/add/observable/concat'
import { Snapshot$, Error$, Snapshot } from './toolchain/common'
import { createLinter } from './toolchain/linter'
import { createParser } from './toolchain/parser'

const DEFAULT_TIMEOUT = 3000

export interface IRequest {
  code: string
  week: number
  timeout?: number
}

export interface ISink {
  snapshot$: Snapshot$,
  error$: Error$
}

export function createContext(request$: Observable<IRequest>): ISink {
  const snapshot$ = request$.map((request) => (new Snapshot({
    week: request.week,
    code: request.code,
    messages: List()
  })))
  const linterSink = createLinter(snapshot$)
  const parserSink = createParser(linterSink.snapshot$)
  return {
    snapshot$: parserSink.snapshot$.timeout(DEFAULT_TIMEOUT),
    error$: Observable.concat(linterSink.error$, parserSink.error$)
  }
}
