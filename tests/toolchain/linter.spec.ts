import test from 'ava'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/observable/of'
import 'rxjs/add/operator/take'

import { Snapshot } from '../../src/toolchain/common'
import { lint, createLinter } from '../../src/toolchain/linter'

test('linter output', (t) => {  
  const code = 'function foo() { return 2; }\n' + 'foo() + 3\n'
  const snapshot = new Snapshot({ code }) 
  const result = lint(snapshot.code)
  const output = result[0]
  t.deepEqual(output.line, 2)  
  t.deepEqual(output.column, 10)
})

test('createLinter', (t) => {
  t.plan(1)
  const code = 'function foo() { return 2; }\n'
  const snapshot$ = Observable.of(new Snapshot({ code }))
  const linter$ = createLinter(snapshot$)
  return new Promise<void>((resolve, reject) => {
    linter$.subscribe((result: Snapshot) => {
      t.deepEqual(result.code, code)
      resolve()
    }) 
  })
})
