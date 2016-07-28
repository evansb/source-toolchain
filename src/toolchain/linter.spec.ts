import test from 'ava'
import * as linter from './linter'

const source = 'function foo() { return 2; }\n' + 'foo() + 3\n'

test('linter:lint', (t) => { 
  const result = linter.lint(source)
  t.truthy(result[0])
  t.true(result.length === 1)
  t.deepEqual(result[0].ruleId, linter.MISSING_SEMICOLON_ID) 
})
