import * as es from 'estree'

import { parse, createParser } from '../src/parser'
import { ErrorType } from '../src/errorTypes'
import { explainError } from '../src/errorUtils'

it('createParser() creates parser state', () => {
  createParser({ week: 3 })
})

it('parses simple statement', () => {
  const parser = createParser({ week: 3})
  const program = parse('1 + 2;', parser).node! as es.Program

  expect(program.type).toBe('Program')
  expect(program.body.length).toBe(1)
  expect(program.body[0].type).toBe('ExpressionStatement')
})

it('recursively attaches unique ID to all nodes', () => {
  const parser = createParser({ week: 3})
  const program = parse('1 + 2;', parser).node! as any

  expect(program.__id).toBeDefined()
  expect(program.body[0].__id).toBeDefined()
  expect(program.body[0].expression.__id).toBeDefined()
  expect(program.body[0].expression.left.__id).toBeDefined()
  expect(program.body[0].expression.right.__id).toBeDefined()
})

it('produces a SyntaxError for non ES5 features', () => {
  const parser = createParser({ week: 3})
  const result = parse('class C {}', parser)
  expect(result.errors.length).toBe(1)
  expect(result.errors[0].explanation).toMatch(/SyntaxError/)
  expect(explainError(result.errors[0])).toMatch(/Syntax.*Error.*/)
})

it('detects Missing Semicolon errors', () => {
  const parser = createParser({ week: 3 })
  const result = parse('1 + 2', parser)
  expect(result.errors.length).toBe(1)
  expect(result.errors[0].type).toBe(ErrorType.MissingSemicolon)
  expect(explainError(result.errors[0])).toMatch(/Missing.*semicolon.*/)
})

it('detects missing Else case', () => {
  const parser = createParser({ week: 3 })
  const result = parse(`
    if (2 === 2) {
      var x = 2;
    }
  `, parser)
  expect(result.errors.length).toBe(1)
  expect(result.errors[0].type).toBe(ErrorType.MissingIfAlternate)
  expect(result.errors[0].node.type).toBe('IfStatement')
  expect(explainError(result.errors[0])).toMatch(/Missing.*else.*/)
})

it('detects If not using curly braces', () => {
  const parser = createParser({ week: 3 })
  const result = parse(`
    if (2 === 2)
      1 + 2;
    else {
      1 + 2;
    }
  `, parser)
  expect(result.errors.length).toBe(1)
  expect(result.errors[0].type).toBe(ErrorType.IfConsequentNotABlockStatement)
  expect(result.errors[0].node.type).toBe('IfStatement')
  expect(explainError(result.errors[0])).toMatch(/curly braces.*if/)
})

it('detects disallowed feature', () => {
  const parser = createParser({ week: 3 })
  const result = parse(`
    var x = 2;
    x = 3;
  `, parser)
  expect(result.errors.length).toBe(1)
  expect(result.errors[0].type).toBe(ErrorType.MatchFailure)
  expect(explainError(result.errors[0])).toMatch(/Assignment.*not allowed/)
})

it('detects Else not using curly braces', () => {
  const parser = createParser({ week: 3 })
  const result = parse(`
    if (2 === 2) {
      1 + 2;
    } else
      1 + 2;
  `, parser)
  expect(result.errors.length).toBe(1)
  expect(result.errors[0].type).toBe(ErrorType.IfAlternateNotABlockStatement)
  expect(result.errors[0].node.type).toBe('IfStatement')
  expect(explainError(result.errors[0])).toMatch(/curly braces.*else/)
})

it('detects not using strict equality', () => {
  const parser = createParser({ week: 3 })
  const result = parse(`2 == 2;`, parser)
  expect(result.errors.length).toBe(1)
  expect(result.errors[0].type).toBe(ErrorType.UseStrictEquality)
  expect(explainError(result.errors[0])).toMatch(/===/)
})

it('detects not using strict inequality', () => {
  const parser = createParser({ week: 3 })
  const result = parse(`2 != 2;`, parser)
  expect(result.errors.length).toBe(1)
  expect(result.errors[0].type).toBe(ErrorType.UseStrictInequality)
  expect(explainError(result.errors[0])).toMatch(/!==/)
})

it('detects trailing comma', () => {
  const parser = createParser({ week: 3 })
  const result = parse(`[1,2,];`, parser)
  expect(result.errors.length).toBe(2)
  expect(result.errors[0].type).toBe(ErrorType.TrailingComma)
  expect(explainError(result.errors[0])).toMatch(/Trailing.*comma/)
})

it('initialises CFG indexed nodes', () => {
  const parser = createParser({ week: 3 })
  const result = parse(`1 + 2;`, parser)
  expect(Object.keys(result.cfg.nodes).length).toBe(5)
})
