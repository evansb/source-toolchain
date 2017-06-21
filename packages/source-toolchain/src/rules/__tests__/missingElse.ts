import { singleError } from '../../harness/parser'
import { MissingElseError } from '../missingElse'

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
