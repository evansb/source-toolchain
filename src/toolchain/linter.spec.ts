import test from 'ava'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/observable/of'
import 'rxjs/add/operator/take'

import { Snapshot } from './common'
import * as linter from './linter'

test('linter output', (t) => {  
  const code = 'function foo() { return 2; }\n' + 'foo() + 3\n'
  const snapshot = new Snapshot({ code }) 
  const result = linter.lint(snapshot.code)
  const output = result[0]
  t.deepEqual(output.line, 2)  
  t.deepEqual(output.column, 10)
})

lintNegative('foo + 3', 'semicolon')
lintNegative('if (x) 2;', 'brace if')
lintNegative('while (x) x++;', 'brace while')

test('createLinter', (t) => {
  t.plan(1)
  const code = 'function foo() { return 2; }\n'
  const snapshot$ = Observable.of(new Snapshot({ code }))
  const linter$ = linter.createLinter(snapshot$)
  return new Promise<void>((resolve, reject) => {
    linter$.subscribe((result: Snapshot) => {
      t.deepEqual(result.code, code)
      resolve()
    }) 
  })
})

function lintNegative(code: string, name: string, plan = 1) { 
  test(`lint:${name}`, (t) => {
    const snapshot = new Snapshot({ code }) 
    t.deepEqual(linter.lint(snapshot.code).length, plan)
  })
}
