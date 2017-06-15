import * as es from 'estree'
import { Stack } from 'immutable'
import { parse } from '../src/parser'
import { next, create } from '../src/visualizer'
import { testVisualizer } from '../src/harness/visualizer'

const parse3 = (x: string) => parse(x, 3).parser.program!

it('create() correctly creates initial visualizer interpreter', () => {
  const state = create()
  expect(state._calls).toBeInstanceOf(Stack)
  expect(state._calls.isEmpty()).toBe(true)
  expect(state.root).not.toBeDefined()
})

describe('next(v, e)', () => {
  it('on top level ExpressionStatement assign current expression to its expression and clears node stack', () => {
    let visualizer = create()
    visualizer = { ...visualizer, nodes: Stack.of(parse3('1;')) }
    const evaluator = {
      _done: false,
      node: parse3('1 + 2;').body[0]
    }
    visualizer = next(visualizer, evaluator)
    expect(visualizer.root).toBeDefined()
    expect(visualizer.root!.type).toBe('BinaryExpression')
  })

  it('stop visualization inside function call until next return statement', () => {
    const program = parse3('function foo() { return 3; }\nfoo();')
    const visualizer = { ...create(), _suppress: false }
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
    const stmt = parse3('1 + (true && false) + (true ? 1 : 2);')
      .body[0] as es.ExpressionStatement

    const exp = stmt.expression as es.BinaryExpression
    const left = exp.left as es.BinaryExpression
    const logical = exp.right as es.LogicalExpression
    const one = left.left as es.Literal
    const trueAndFalse = left.right as es.LogicalExpression

    const base = { ...create(), root: exp, _suppress: false }
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
  testVisualizer('1 + (1 && 3) + (true ? 1 : 2);', [
    '1 + (1 && 3) + (true ? 1 : 2)',
    '1 + 3 + (true ? 1 : 2)',
    '4 + (true ? 1 : 2)',
    '4 + 1',
    '5'
  ])
})

it('visualizes recursive calls (binary expression)', () => {
  testVisualizer(
    `function factorial(n) {
      if (n <= 1) {
        return 1;
      } else {
        return n * factorial(n - 1);
      }
    }
    factorial(3);
    `,
    [
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
  )
})

it('visualizes recursive calls (logical expression)', () => {
  testVisualizer(
    `function doo(n) {
      if (n >= 4) {
        return true;
      } else {
        return false || doo(n + 1);
      }
    }
    doo(1);
    `,
    [
      'doo(1)',
      'false || doo(n + 1)',
      'false || doo(1 + 1)',
      'false || doo(2)',
      'false || (false || doo(n + 1))',
      'false || (false || doo(2 + 1))',
      'false || (false || doo(3))',
      'false || (false || (false || doo(n + 1)))',
      'false || (false || (false || doo(3 + 1)))',
      'false || (false || (false || doo(4)))',
      'false || (false || (false || true))',
      'false || (false || true)',
      'false || true',
      'true'
    ]
  )
})

it('visualizes recursive calls (fibonacci)', () => {
  testVisualizer(
    `function fib(n) {
      if (n === 0) {
        return 0;
      } else {
        if (n === 1) {
          return 1;
        } else {
          return fib(n - 1) + fib(n - 2);
        }
      }
    }
    fib(4);
    `,
    [
      'fib(4)',
      'fib(n - 1) + fib(n - 2)',
      'fib(4 - 1) + fib(n - 2)',
      'fib(3) + fib(n - 2)',
      'fib(n - 1) + fib(n - 2) + fib(n - 2)',
      'fib(3 - 1) + fib(n - 2) + fib(n - 2)',
      'fib(2) + fib(n - 2) + fib(n - 2)',
      'fib(n - 1) + fib(n - 2) + fib(n - 2) + fib(n - 2)',
      'fib(2 - 1) + fib(n - 2) + fib(n - 2) + fib(n - 2)',
      'fib(1) + fib(n - 2) + fib(n - 2) + fib(n - 2)',
      '1 + fib(n - 2) + fib(n - 2) + fib(n - 2)',
      '1 + fib(2 - 2) + fib(n - 2) + fib(n - 2)',
      '1 + fib(0) + fib(n - 2) + fib(n - 2)',
      '1 + 0 + fib(n - 2) + fib(n - 2)',
      '1 + fib(n - 2) + fib(n - 2)',
      '1 + fib(3 - 2) + fib(n - 2)',
      '1 + fib(1) + fib(n - 2)',
      '1 + 1 + fib(n - 2)',
      '2 + fib(n - 2)',
      '2 + fib(4 - 2)',
      '2 + fib(2)',
      '2 + (fib(n - 1) + fib(n - 2))',
      '2 + (fib(2 - 1) + fib(n - 2))',
      '2 + (fib(1) + fib(n - 2))',
      '2 + (1 + fib(n - 2))',
      '2 + (1 + fib(2 - 2))',
      '2 + (1 + fib(0))',
      '2 + (1 + 0)',
      '2 + 1',
      '3'
    ]
  )
})
