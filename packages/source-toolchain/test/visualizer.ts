import * as es from 'estree'
import { Stack } from 'immutable'
import { generate } from 'escodegen'
import { parse } from '../src/parser'
import { next, create, VisualizerState } from '../src/visualizer'
import { evalProgram, createState } from '../src/evaluator'

it('create() correctly creates initial visualizer state', () => {
  const state = create()
  expect(state._calls).toBeInstanceOf(Stack)
  expect(state._calls.isEmpty()).toBe(true)
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


  it('stop visualization inside function call until next return statement', () => {
    const program = parse('function foo() { return 3; }\nfoo();', 3).node!
    let visualizer = {...create(), _suppress: false}
    const evaluator = {
      _done: false,
      node: (program.body[0] as any).body
    }
    const evaluator2 = {
      _done: false,
      node: (program.body[0] as any).body[0]
    }
    const visualizer2 = next(visualizer, evaluator)
    expect(visualizer2._suppress).toBe(true)
    const visualizer3 = next(visualizer, evaluator2)
    expect(visualizer3._suppress).toBe(false)
  })

  it('replaces completely evaluated expression with its value', () => {
    const stmt = parse('1 + (true && false) + (true ? 1 : 2);', 3).node!.body[0] as es.ExpressionStatement

    const exp = stmt.expression as es.BinaryExpression
    const left = exp.left as es.BinaryExpression
    const logical = exp.right as es.LogicalExpression
    const one = left.left as es.Literal
    const trueAndFalse = left.right as es.LogicalExpression

    const base = {...create(), root: exp, _suppress: false }
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
      node: logical,
      value: 3
    })
    expect(result.root.right.type).toBe('Literal')
    expect(result.root.right.value).toBe(3)
    result = next(base, {
      _done: true,
      node: trueAndFalse,
      value: false
    })
    expect(result.root.left.right.type).toBe('Literal')
    expect(result.root.left.right.value).toBe(false)
  })
})

it('visualizes complex expression without function calls', () => {
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

it('visualizes complex expression with calls', () => {
  const program = parse(
`function factorial(n) {
  if (n <= 1) {
    return 1;
  } else {
    return n * factorial(n - 1);
  }
}
factorial(3);
`, 3).node!
  let gen
  let state = createState()
  let visualizer = create()
  const evaluator = evalProgram(program, state)

  const expectedPrints = [
    'factorial(3)',
    'n * factorial(n - 1)',
    '3 * factorial(n - 1)',
    '3 * factorial(3 - 1)',
    '3 * factorial(2)',
    '3 * (n * factorial(n - 1))',
    '3 * (2 * factorial(n - 1))',
    '3 * (2 * factorial(2 - 1))',
    '3 * (2 * factorial(1))',
    '3 * (2 * 1)',
    '3 * 2',
    '6'
  ]

  const prints = []

  while (gen = evaluator.next()) {
    state = gen.value
    if (!state) { break }
    const prev = visualizer
    visualizer = next(visualizer, state)
    if (visualizer.root && (visualizer.id !== prev.id)) {
      prints.push(generate(visualizer.root))
    }
  }
  expect(prints).toEqual(expectedPrints)
})

