import { singleError } from '../src/harness/parser'
import { createContext } from '../src/context'
import {
  parse,
  TrailingCommaError,
  DisallowedConstructError,
  MissingSemicolonError,
  FatalSyntaxError
} from '../src/parser'

const parse3 = (src: string) => parse(src, 3).parser.program!
const parse3e = (src: string) => parse(src, 3).parser.errors

it('createContext() creates parser state', () => {
  createContext({ week: 3 })
})

it('parses simple statement', () => {
  const program = parse3('1 + 2;')
  expect(program.type).toBe('Program')
  expect(program.body.length).toBe(1)
  expect(program.body[0].type).toBe('ExpressionStatement')
})

it('recursively attaches unique ID to all nodes', () => {
  const program = parse3('1 + 2;') as any
  expect(program.__id).toBeDefined()
  expect(program.body[0].__id).toBeDefined()
  expect(program.body[0].expression.__id).toBeDefined()
  expect(program.body[0].expression.left.__id).toBeDefined()
  expect(program.body[0].expression.right.__id).toBeDefined()
})

it('produces a SyntaxError for non ES5 features', () => {
  const result = parse3e('class C {}')
  expect(result.length).toBe(1)
  expect(result[0].explain()).toMatch(/Syntax Error/)
  expect(result[0]).toBeInstanceOf(FatalSyntaxError)
})

it('detects Missing Semicolon errors', () => {
  singleError('1 + 2', {
    errorClass: MissingSemicolonError,
    explanation: /Missing.*semicolon/
  })
})

it('detects disallowed feature', () => {
  singleError(
    `
    var x = 2;
    x = 3;
  `,
    {
      errorClass: DisallowedConstructError,
      explanation: /Assignment.*not allowed/
    }
  )
})

it('detects trailing comma', () => {
  singleError(`[1,2,];`, {
    week: 13,
    errorClass: TrailingCommaError,
    explanation: /Trailing.*comma/
  })
})

it('initialises CFG indexed nodes', () => {
  const result = parse(`1 + 2;`, 3)
  expect(Object.keys(result.cfg.nodes).length).toBe(5)
})
