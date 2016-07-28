import test from 'ava'
import * as linter from './linter'
import { printToString } from './printer'

const source = 'function foo() { return 2; }\n' + 'foo() + 3\n'

test('linter:lint', (t) => { 
  const message = linter.lint(source)
  t.truthy(message.header)
  t.true(message.results.length === 1)
  t.deepEqual(message.results[0].line, 2)  
  t.deepEqual(message.results[0].column, 10)
  console.log(printToString(message))
})
