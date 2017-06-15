import { singleError } from '../src/harness/parser'
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
  singleError('1 + 2', {
    errorType: ErrorType.MissingSemicolon,
    match: /Missing.*semicolon/
  })
})

it('detects missing Else case', () => {
  singleError(
    `
    if (2 === 2) {
      var x = 2;
    }
  `,
    {
      errorType: ErrorType.MissingIfAlternate,
      match: /Missing.*else.*/
    }
  )
})

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
      errorType: ErrorType.IfConsequentNotABlockStatement,
      match: /curly braces.*if/
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
      errorType: ErrorType.IfAlternateNotABlockStatement,
      match: /curly braces.*else/
    }
  )
})

it('detects disallowed feature', () => {
  singleError(
    `
    var x = 2;
    x = 3;
  `,
    {
      errorType: ErrorType.MatchFailure,
      match: /Assignment.*not allowed/
    }
  )
})

it('detects not using strict equality', () => {
  singleError(`2 == 2;`, {
    errorType: ErrorType.UseStrictEquality,
    match: /===/
  })
})

it('detects not using strict inequality', () => {
  singleError(`2 != 2;`, {
    errorType: ErrorType.UseStrictInequality,
    match: /!==/
  })
})

it('detects missing declaration value', () => {
  singleError(`var x;`, {
    errorType: ErrorType.MissingDeclarationExpression,
    match: /Missing/
  })
})

it('detects trailing comma', () => {
  singleError(`[1,2,];`, {
    week: 13,
    errorType: ErrorType.TrailingComma,
    match: /Trailing.*comma/
  })
})

it('initialises CFG indexed nodes', () => {
  const result = parse(`1 + 2;`, 3)
  expect(Object.keys(result.cfg.nodes).length).toBe(5)
})
