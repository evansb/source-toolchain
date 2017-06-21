import { singleError, noError } from '../../harness/parser'
import { BracesAroundIfElseError } from '../bracesAroundIfElse'

it('detects If not using curly braces', () => {
  singleError(
    `
    if (2 === 2)
      var zomg = 2;
    else {
      1 + 2;
    }
  `,
    {
      errorClass: BracesAroundIfElseError,
      explanation: /curly braces.*if/,
      elaboration: /if \(2 === 2\)/
    }
  )
})

it('detects Else not using curly braces', () => {
  singleError(
    `
    if (2 === 2) {
      1 + 2;
    } else
      var zomg = 2;
  `,
    {
      errorClass: BracesAroundIfElseError,
      explanation: /curly braces.*else/,
      elaboration: /zomg/
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
