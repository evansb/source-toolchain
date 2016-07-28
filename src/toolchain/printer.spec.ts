import test from 'ava'
import * as printer from './printer'

const message1 = {
  header: 'Test Header',
  code: '\n'
    + 'function foo() {\n'
    + '   return 2;\n'
    + '}\n'
    + 'function bar() {\n'
    + '   return 9;\n'
    + '}\n'
  ,
  results: [{
    line: 2,
    endLine: 4,
    column: 4,
    endColumn: 8,
    message: 'Test Message'
  }]
}

test('printer:printToString', (t) => { 
  const result = printer.printToString(message1) 
  console.log('\n' + result)
  t.true(typeof result === 'string')
  t.regex(result, /Test Message/) 
  t.regex(result, /Test Header/)  
  t.regex(result, /line 2 col 4 - line 4 col 8/) 
  t.regex(result, /-------\^/)
})
