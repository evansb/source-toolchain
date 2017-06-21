import { stripIndent } from 'common-tags'
import { numberT } from '../../src/types/static'
import {
  parseTypecheckerTest,
  runTypecheckerTest
} from '../../src/harness/typechecker'

const sample1 = [
  {
    assertions: [
      {
        name: 'x',
        type: numberT
      }
    ],
    name: 'Sample Test',
    source: `//@ Sample Test
var x = 2;
//! x: number\n`
  },
  {
    assertions: [
      {
        name: 'z',
        type: numberT
      }
    ],
    name: 'Another Test',
    source: `//@ Another Test
var y = 1;
var z = 2;
//! z: number\n`
  }
]

it('parses empty string correctly', () => {
  expect(parseTypecheckerTest('')).toEqual([])
})

it('parses no test correctly', () => {
  expect(parseTypecheckerTest('//@ Hello World')).toEqual([
    {
      assertions: [],
      name: 'Hello World',
      source: '//@ Hello World\n'
    }
  ])
})

it('parses single test correctly', () => {
  const source = stripIndent`
    //@ Sample Test
    var x = 2;
    //! x: number
  `
  expect(parseTypecheckerTest(source)).toEqual([
    {
      assertions: [
        {
          name: 'x',
          type: {
            name: 'number'
          }
        }
      ],
      name: 'Sample Test',
      source: source + '\n'
    }
  ])
})

it('parses multiple test correctly', () => {
  const source = stripIndent`
    //@ Sample Test
    var x = 2;
    //! x: number
    //@ Another Test
    var y = 1;
    var z = 2;
    //! z: number
  `
  expect(parseTypecheckerTest(source)).toEqual(sample1)
})

it('runs empty suites correctly', () => {
  const parse = jest.fn()
  const generateCFG = jest.fn()
  const typecheck = jest.fn()
  runTypecheckerTest([], parse, generateCFG, typecheck)
  expect(parse).not.toHaveBeenCalled()
  expect(generateCFG).not.toHaveBeenCalled()
  expect(typecheck).not.toHaveBeenCalled()
})

it('runs some suites correctly', () => {
  const parse = jest.fn()
  const generateCFG = jest.fn()
  const typecheck = jest.fn(state => {
    state.cfg.scopes[0].env.x = { type: numberT }
    state.cfg.scopes[0].env.z = { type: numberT }
  })
  runTypecheckerTest(sample1 as any, parse, generateCFG, typecheck)
  expect(parse.mock.calls.length).toBe(2)
  expect(typecheck.mock.calls.length).toBe(2)
  expect(generateCFG.mock.calls.length).toBe(2)
})
