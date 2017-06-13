import { createContext } from '../src/context'
import { parse } from '../src/parser'
import { ErrorType } from '../src/types/error'
import { explainError } from '../src/errorUtils'

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
  expect(result[0].explanation).toMatch(/SyntaxError/)
  expect(explainError(result[0])).toMatch(/Syntax.*Error.*/)
})

it('detects Missing Semicolon errors', () => {
  const result = parse3e('1 + 2')
  expect(result.length).toBe(1)
  expect(result[0].type).toBe(ErrorType.MissingSemicolon)
  expect(explainError(result[0])).toMatch(/Missing.*semicolon.*/)
})

it('detects missing Else case', () => {
  const result = parse3e(`
    if (2 === 2) {
      var x = 2;
    }
  `)
  expect(result.length).toBe(1)
  expect(result[0].type).toBe(ErrorType.MissingIfAlternate)
  expect(result[0].node.type).toBe('IfStatement')
  expect(explainError(result[0])).toMatch(/Missing.*else.*/)
})

it('detects If not using curly braces', () => {
  const result = parse3e(`
    if (2 === 2)
      1 + 2;
    else {
      1 + 2;
    }
  `)
  expect(result.length).toBe(1)
  expect(result[0].type).toBe(ErrorType.IfConsequentNotABlockStatement)
  expect(result[0].node.type).toBe('IfStatement')
  expect(explainError(result[0])).toMatch(/curly braces.*if/)
})

it('detects disallowed feature', () => {
  const result = parse3e(`
    var x = 2;
    x = 3;
  `)
  expect(result.length).toBe(1)
  expect(result[0].type).toBe(ErrorType.MatchFailure)
  expect(explainError(result[0])).toMatch(/Assignment.*not allowed/)
})

it('detects Else not using curly braces', () => {
  const result = parse3e(`
    if (2 === 2) {
      1 + 2;
    } else
      1 + 2;
  `)
  expect(result.length).toBe(1)
  expect(result[0].type).toBe(ErrorType.IfAlternateNotABlockStatement)
  expect(result[0].node.type).toBe('IfStatement')
  expect(explainError(result[0])).toMatch(/curly braces.*else/)
})

it('detects not using strict equality', () => {
  const result = parse3e(`2 == 2;`)
  expect(result.length).toBe(1)
  expect(result[0].type).toBe(ErrorType.UseStrictEquality)
  expect(explainError(result[0])).toMatch(/===/)
})

it('detects not using strict inequality', () => {
  const result = parse3e(`2 != 2;`)
  expect(result.length).toBe(1)
  expect(result[0].type).toBe(ErrorType.UseStrictInequality)
  expect(explainError(result[0])).toMatch(/!==/)
})

it('detects missing declaration value', () => {
  const result = parse3e(`var x;`)
  expect(result.length).toBe(1)
  expect(result[0].type).toBe(ErrorType.NoDeclarations)
  expect(explainError(result[0])).toMatch(/Missing/)
})

it('detects trailing comma', () => {
  const result = parse3e(`[1,2,];`)
  expect(result.length).toBe(2)
  expect(result[0].type).toBe(ErrorType.TrailingComma)
  expect(explainError(result[0])).toMatch(/Trailing.*comma/)
})

it('initialises CFG indexed nodes', () => {
  const result = parse(`1 + 2;`, 3)
  expect(Object.keys(result.cfg.nodes).length).toBe(5)
})
