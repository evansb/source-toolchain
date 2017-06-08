import { parse } from 'acorn'
import { Stack } from 'immutable'
import { InspectableState } from '../src/Evaluator'
import { visualizeNext, createVisualizerState, VisualizerState } from '../src/visualizer'

it('createVisualizerState correctly creates initial visualizer state', () => {
  const state = createVisualizerState()
  expect(state.nodes).toBeInstanceOf(Stack)
  expect(state.nodes.isEmpty()).toBe(true)
  expect(state.calls).toBeInstanceOf(Stack)
  expect(state.calls.isEmpty()).toBe(true)
  expect(state.current).not.toBeDefined()
})

describe('visualizeNext', () => {
  it('on top level ExpressionStatement assign current expression to its expression', () => {
    let visualizer = createVisualizerState()
    const evaluator: InspectableState = {
      _done: false,
      node: parse('1 + 2;').body[0]
    }
    visualizer = visualizeNext(visualizer, evaluator)
    expect(visualizer.current).toBeDefined()
    expect(visualizer.current!.type).toBe('BinaryExpression')
  })
})
