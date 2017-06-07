import * as es from 'estree'
import { parse } from 'acorn'
import { runConformationTests } from '../src/harness/conformation'
import { evalProgram, State, Closure } from '../src/evaluator'

it('evaluates program', () => {
  const generator = evalProgram(parse('1 + 2;'), new State())
  const states = []
  let g = generator.next()
  while (g.value.isRunning) {
    states.push(g.value)
    g = generator.next()
  }
  expect(states[0].node.type).toBe('ExpressionStatement')
  expect(states[1].node.type).toBe('BinaryExpression')
  expect(states[2].node.type).toBe('Literal')
  expect(states[3].node.type).toBe('Literal')
  expect(states[4].node.type).toBe('Literal')
  expect(states[5].node.type).toBe('Literal')
  expect(states[6].node.type).toBe('BinaryExpression')
  expect(states.length).toBe(7)
})

describe('Closure class', () => {
  it('creates correct scope', () => {
    const node: any = parse('function factorial(n) {}').body[0]
    const closure = new Closure(node, 0)
    const scope = closure.createScope([4])
    expect(scope.name).toBe('factorial(4)')
    expect(scope.environment.get('n')).toBe(4)
    expect(scope.parent).toBe(0)
  })
  it('creates correct scope from anonymous function', () => {
    const node: any = (parse('var x = function (n) {};').body[0] as any).declarations[0].init
    const closure = new Closure(node, 0, 0)
    const scope = closure.createScope([4])
    expect(scope.name).toBe('<lambda-0>(4)')
    expect(scope.environment.get('n')).toBe(4)
    expect(scope.parent).toBe(0)
  })
  it('returns correct scope name if closure is passed as arguments', () => {
    const node: any = (parse('var x = function (n) {};').body[0] as any).declarations[0].init
    const closure = new Closure(node, 0, 0)
    const scope = closure.createScope([new Closure(node, 0, 1)])
    expect(scope.name).toBe('<lambda-0>(<lambda-1>)')
  })
})

it('passes Week 3 Conformation Test', () => {
  runConformationTests('conformation/week-3.js')
})
