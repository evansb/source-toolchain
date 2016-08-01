import test from 'ava'
import * as printer from './printer'
import { Snapshot } from './common'

const snapshot1 = new Snapshot({
  code: '\n'
    + 'function foo() {\n'
    + '   return 2;\n'
    + '}\n'
    + 'function bar() {\n'
    + '   return 9;\n'
    + '}\n'
})

const message1 = {
  from: 'test',
  line: 2, 
  endLine: 4,
  column: 4,
  endColumn: 8,
  message: 'Test Message'
}

test('printToString', (t) => { 
  const result = printer.printErrorToString(snapshot1, message1) 
  t.true(typeof result === 'string')
  t.regex(result, /Test Message/) 
  t.regex(result, /\(line 2 col 4\) - \(line 4 col 8\)/)  
  t.regex(result, /function foo()/) 
  t.regex(result, /-------\^/)
})
