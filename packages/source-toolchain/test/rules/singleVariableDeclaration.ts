import { singleError } from '../../src/harness/parser'
import { MultipleDeclarationsError } from '../../src/rules/singleVariableDeclaration'

it('detects missing declaration value', () => {
  singleError(`var x = 2, y = 3;`, {
    errorClass: MultipleDeclarationsError,
    explanation: /Multiple/
  })
})
