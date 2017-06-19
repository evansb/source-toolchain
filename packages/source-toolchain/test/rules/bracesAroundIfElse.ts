import { singleError } from '../../src/harness/parser'
import { BracesAroundIfElseError } from '../../src/rules/bracesAroundIfElse'

it('detects If not using curly braces', () => {
  singleError(
    `
    if (2 === 2)
      1 + 2;
    else {
      1 + 2;
    }
  `,
    {
      errorClass: BracesAroundIfElseError,
      explanation: /curly braces.*if/
    }
  )
})

it('detects Else not using curly braces', () => {
  singleError(
    `
    if (2 === 2) {
      1 + 2;
    } else
      1 + 2;
  `,
    {
      errorClass: BracesAroundIfElseError,
      explanation: /curly braces.*else/
    }
  )
})
