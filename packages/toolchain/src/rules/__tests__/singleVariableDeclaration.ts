import { singleError } from '../../harness/parser'
import { MultipleDeclarationsError } from '../singleVariableDeclaration'

it('detects multiple declarations', () => {
  singleError(`var x = 2, y = 3;`, {
    errorClass: MultipleDeclarationsError,
    explanation: /Multiple/
  })
})
