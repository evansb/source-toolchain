import { parse } from '../parser'
import { ErrorType } from '../errorTypes'
import * as es from 'estree'

it('parses simple statement', () => {
  const program = parse('1 + 2;', 3).node! as es.Program

  expect(program.type).toBe('Program')
  expect(program.body.length).toBe(1)
  expect(program.body[0].type).toBe('ExpressionStatement')
})

it('produces symbol table correctly', () => {
  const result = parse(`
function foo() {
  var a = 2;
  var b = 10;
}
var c = 2;
var d = 4;
var e = 5;
  `, 3)
  expect(result.environments['*'].foo).toBeDefined()
  expect(Object.keys(result.environments)).toEqual(['*', 'foo'])
  expect(Object.keys(result.environments['*'])).toEqual(['foo', 'c', 'd', 'e'])
  expect(Object.keys(result.environments.foo)).toEqual(['a', 'b'])
})

it('produces a SyntaxError for non ES5 features', () => {
  const result = parse('class C {}', 3)
  expect(result.errors.length).toBe(1)
  expect(result.errors[0].explanation).toMatch(/SyntaxError/)
})

it('detects Missing Semicolon errors', () => {
  const result = parse('1 + 2', 3)
  expect(result.errors.length).toBe(1)
  expect(result.errors[0].type).toBe(ErrorType.MissingSemicolon)
})

it('detects Undefined Variable errors', () => {
  const result = parse('var x = 2; var y = z + 3;', 3)
  expect(result.errors.length).toBe(1)
  expect(result.errors[0].type).toBe(ErrorType.UndefinedVariable)
})

it('does not throw Undefined Variable for variables defined in parent environment', () => {
  const result = parse(`
  var z = 2;
  function foo() {
    return z;
  }`, 3)
  expect(result.errors.length).toBe(0)
})

it('detects missing Else case', () => {
  const result = parse(`
    if (2 === 2) {
      var x = 2;
    }
  `, 3)
  expect(result.errors.length).toBe(1)
  expect(result.errors[0].type).toBe(ErrorType.MissingIfAlternate)
  expect(result.errors[0].node.type).toBe('IfStatement')
})

it('detects If not using curly braces', () => {
  const result = parse(`
    if (2 === 2)
      1 + 2;
    else {
      1 + 2;
    }
  `, 3)
  expect(result.errors.length).toBe(1)
  expect(result.errors[0].type).toBe(ErrorType.IfConsequentNotABlockStatement)
  expect(result.errors[0].node.type).toBe('IfStatement')
})

it('detects Else not using curly braces', () => {
  const result = parse(`
    if (2 === 2) {
      1 + 2;
    } else
      1 + 2;
  `, 3)
  expect(result.errors.length).toBe(1)
  expect(result.errors[0].type).toBe(ErrorType.IfAlternateNotABlockStatement)
  expect(result.errors[0].node.type).toBe('IfStatement')
})

it('detects not using strict equality', () => {
  const result = parse(`2 == 2;`, 3)
  expect(result.errors.length).toBe(1)
  expect(result.errors[0].type).toBe(ErrorType.UseStrictEquality)
})

it('detects not using strict inequality', () => {
  const result = parse(`2 != 2;`, 3)
  expect(result.errors.length).toBe(1)
  expect(result.errors[0].type).toBe(ErrorType.UseStrictInequality)
})
