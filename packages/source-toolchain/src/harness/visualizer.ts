import { generate } from 'escodegen'
import { parse } from '../parser'
import { createState, evalProgram } from '../evaluator'
import { create, next } from '../visualizer'

export const testVisualizer = (program: string, expectedOutput: string[]) => {
  let state = createState()
  let visualizer = create()

  const node = parse(program, 3).node!
  const evaluator = evalProgram(node, state)
  const prints = []

  let gen = evaluator.next()
  while (gen) {
    state = gen.value
    if (!state) { break }
    const prev = visualizer
    visualizer = next(visualizer, state)
    if (visualizer.root && (visualizer.id !== prev.id)) {
      prints.push(generate(visualizer.root))
    }
    gen = evaluator.next()
  }
  expect(prints).toEqual(expectedOutput)
}
