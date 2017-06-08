import * as es from 'estree'
import { Stack } from 'immutable'
import { generate } from 'escodegen'
import { parse } from '../src/parser'
import { next, create, VisualizerState } from '../src/visualizer'
import { evalProgram, createState } from '../src/evaluator'

it('create() correctly creates initial visualizer state', () => {
  const state = create()
  expect(state.calls).toBeInstanceOf(Stack)
  expect(state.calls.isEmpty()).toBe(true)
  expect(state.root).not.toBeDefined()
})

describe('next(v, e)', () => {
  it('on top level ExpressionStatement assign current expression to its expression and clears node stack', () => {
    let visualizer = create()
    visualizer = {...visualizer, nodes: Stack.of(parse('1;', 3).node!)}
    const evaluator = {
      _done: false,
      node: parse('1 + 2;', 3).node!.body[0]
    }
    visualizer = next(visualizer, evaluator)
    expect(visualizer.root).toBeDefined()
    expect(visualizer.root!.type).toBe('BinaryExpression')
  })

  it('replaces completely evaluated expression with its value', () => {
    const stmt = parse('1 + (true && false) + (true ? 1 : 2);', 3).node!.body[0] as es.ExpressionStatement

    const exp = stmt.expression as es.BinaryExpression
    const left = exp.left as es.BinaryExpression
    const logical = exp.right as es.LogicalExpression
    const one = left.left as es.Literal
    const trueAndFalse = left.right as es.LogicalExpression

    const base = {...create(), root: exp }
    let result: any
    result = next(base, {
      _done: true,
      node: one,
      value: 1
    })
    expect(result.root.left.left.type).toBe('Literal')
    expect(result.root.left.left.value).toBe(1)
    result = next(base, {
      _done: true,
      node: trueAndFalse,
      value: false
    })
    expect(result.root.left.right.type).toBe('Literal')
    expect(result.root.left.right.value).toBe(false)
    result = next(base, {
      _done: true,
      node: logical,
      value: 3
    })
    expect(result.root.right.type).toBe('Literal')
    expect(result.root.right.value).toBe(3)
  })
})

it('visualizes complex expression', () => {
  const program = parse('1 + (1 && 3) + (true ? 1 : 2);', 3).node!
  let gen
  let state = createState()
  let visualizer = create()
  const evaluator = evalProgram(program, state)

  const expectedPrints = [
    '1 + (1 && 3) + (true ? 1 : 2)',
    '1 + 3 + (true ? 1 : 2)',
    '4 + (true ? 1 : 2)',
    '4 + 1',
    '5'
  ]

  const prints = []

  while (gen = evaluator.next()) {
    state = gen.value
    if (!state) { break }
    const prev = visualizer
    visualizer = next(visualizer, state)
    if (visualizer.root && (visualizer !== prev)) {
      prints.push(generate(visualizer.root))
    }
  }

  expect(expectedPrints).toEqual(prints)
})
