import { numberT, stringT, booleanT } from '../src/types/static'
import { isSameType, parseString } from '../src/typechecker'
import { runTypecheckerTest } from '../src/harness/typechecker'

it('isSameType works correctly', () => {
  expect(isSameType(numberT, numberT)).toBe(true)
  expect(isSameType(booleanT, booleanT)).toBe(true)
  expect(isSameType(stringT, stringT)).toBe(true)
  expect(
    isSameType(
      {
        name: 'function',
        params: [numberT],
        returnType: numberT
      },
      {
        name: 'function',
        params: [numberT],
        returnType: numberT
      }
    )
  ).toBe(true)
  expect(isSameType(stringT, numberT)).toBe(false)
  expect(
    isSameType(
      {
        name: 'function',
        params: [stringT],
        returnType: numberT
      },
      {
        name: 'function',
        params: [numberT],
        returnType: numberT
      }
    )
  ).toBe(false)
  expect(
    isSameType(
      {
        name: 'function',
        params: [stringT],
        returnType: numberT
      },
      {
        name: 'function',
        params: [stringT],
        returnType: stringT
      }
    )
  ).toBe(false)
})

it('parseString works correctly', () => {
  expect(parseString('number')).toBe(numberT)
  expect(parseString('string')).toBe(stringT)
  expect(parseString('boolean')).toBe(booleanT)
})

describe('Week 3 Typecheckers', () => {
  runTypecheckerTest('week-3.js')
})
