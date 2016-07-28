import { Observable } from 'rxjs/Observable'
import { List } from 'immutable'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/timeout'
import 'rxjs/add/observable/of'
import { ISnapshot } from './toolchain/common'
import { createLinter } from './toolchain/linter'
/// <reference path='../typings/index.d.ts' />

const DEFAULT_TIMEOUT = 3000

export interface IRequest {
  code: string
  week: number
  timeout?: number
}

export function createContext(
  request$: Observable<IRequest>
): Observable<ISnapshot> {
  return Observable.create((observer) => {
    request$.subscribe((request) => {
      const timeout = request.timeout || DEFAULT_TIMEOUT
      const snapshot: Observable<ISnapshot> = Observable.of({
        week: request.week,
        code: request.code,
        messages: List()
      })
      const linter = createLinter(snapshot)
      return linter.timeout(timeout)
    })
  })
}
