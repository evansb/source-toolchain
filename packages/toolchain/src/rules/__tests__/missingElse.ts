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

it('detects missing Else case in if-elseif', () => {
  singleError(
    `
    if (2 === 2) {
      var x = 2;
    } else if (2 === 1) {
      var y = 2;
    }
  `,
    {
      errorClass: MissingElseError,
      explanation: /Missing.*else.*/
    }
  )
})
