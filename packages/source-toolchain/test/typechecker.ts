import * as fs from 'fs'
import * as path from 'path'
import { parse } from '../src/parser'
import { generateCFG } from '../src/cfg'
import { numberT, stringT, booleanT } from '../src/types/static'
import { typecheck, isSameType, parseString } from '../src/typechecker'
import {
  parseTypecheckerTest,
  runTypecheckerTest
} from '../src/harness/typechecker'

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

it('pass week 3 typecheckers suites', done => {
  const file = path.resolve(__dirname, 'fixtures', 'typechecker', 'week-3.js')
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) {
      fail(err)
      done()
    } else {
      const suites = parseTypecheckerTest(data)
      runTypecheckerTest(suites, parse, generateCFG, typecheck)
      done()
    }
  })
})
