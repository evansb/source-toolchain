import { singleError } from '../../harness/parser'
import { StrictEqualityError } from '../strictEquality'

it('detects not using strict equality', () => {
  singleError(`2 == 2;`, {
    errorClass: StrictEqualityError,
    explanation: /===/
  })
})

it('detects not using strict inequality', () => {
  singleError(`2 != 2;`, {
    errorClass: StrictEqualityError,
    explanation: /!==/
  })
})
