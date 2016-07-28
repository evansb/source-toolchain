import test from 'ava'
import { List } from 'immutable'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/observable/of'
import 'rxjs/add/operator/map'

import { ISnapshot } from './common'
import * as linter from './linter'

const source = 'function foo() { return 2; }\n' + 'foo() + 3\n'

const snapshot$: Observable<ISnapshot> = Observable.of({
  code: source,
  messages: List()
})

test('lint', (t) => { 
  const message = linter.lint(source)
  t.truthy(message.header)
  t.true(message.results.length === 1)
  t.deepEqual(message.results[0].line, 2)  
  t.deepEqual(message.results[0].column, 10)
})

test('createLinter', (t) => {
  t.plan(2)
  const linter$ = linter.createLinter(snapshot$)
  return new Promise<void>((resolve, reject) => {
    linter$.subscribe((result) => {
      t.deepEqual(result.code, source)
      t.deepEqual(result.messages.count(), 1)
      resolve()
    })
  })
})
