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
      errorClass: BracesAroundIfElseError
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
      errorClass: BracesAroundIfElseError
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
