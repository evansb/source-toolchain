import { singleError, noError } from '../../harness/parser'
import { BracesAroundIfElseError } from '../bracesAroundIfElse'

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

it('allows else-if not using curly braces', () => {
  noError(
    `
    if (2 === 2) {
      1 + 1;
    } else if (1 === 2) {
      1 + 2;
    } else {
      1 + 3;
    }
  `
  )
})
