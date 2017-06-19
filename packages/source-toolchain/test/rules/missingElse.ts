import { singleError } from '../../src/harness/parser'
import { MissingElseError } from '../../src/rules/missingElse'

it('detects missing Else case', () => {
  singleError(
    `
    if (2 === 2) {
      var x = 2;
    }
  `,
    {
      errorClass: MissingElseError,
      explanation: /Missing.*else.*/
    }
  )
})
