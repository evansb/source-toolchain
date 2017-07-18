import { parse } from 'acorn'
import { runConformationTests } from '../harness/conformation'
import { evalProgram, createInterpreter } from '../interpreter'

it('interprets simple program', () => {
  const generator = evalProgram(parse('1 + 2;'), createInterpreter())
  const states = []
  let g = generator.next()
  while (g.value.isRunning) {
    states.push(g.value)
    g = generator.next()
  }
  expect(states.length).toBe(7)
  expect(states[0].node!.type).toBe('ExpressionStatement')
  expect(states[1].node!.type).toBe('BinaryExpression')
  expect(states[2].node!.type).toBe('Literal')
  expect(states[3].node!.type).toBe('Literal')
  expect(states[4].node!.type).toBe('Literal')
  expect(states[5].node!.type).toBe('Literal')
  expect(states[6].node!.type).toBe('BinaryExpression')
})

it('passes Week 3 Conformation Test', () => {
  runConformationTests('week-3.js')
})

it('passes Week 3 Conformation Test (martin)', () => {
  runConformationTests('week-3-martin.js')
})
