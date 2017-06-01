import { parse } from 'acorn'
import { runConformationTests } from '../testUtils'
import { evalProgram, State } from '../evaluator'

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

it('passes Week 3 Conformation Test', () => {
  runConformationTests('conformation/week-3.js')
})
