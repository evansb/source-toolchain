/**
 * Visualize reductions of expressions.
 */
import * as es from 'estree'
import { Stack } from 'immutable'
import { InspectableState } from './evaluator'

export type VisualizerState = {
  current?: es.Node
  calls: Stack<es.Node>
  nodes: Stack<es.Node>
}

export const createVisualizerState = (): VisualizerState => ({
  calls: Stack<es.Node>(),
  nodes: Stack<es.Node>()
})

export const visualizeNext = (visualizer: VisualizerState, evaluator: InspectableState): VisualizerState => {
  const { calls, nodes } = visualizer

  if (!evaluator.node) {
    return visualizer
  }

  if (evaluator._done) {
    switch (evaluator.node.type) {
      case 'VariableDeclaration':
      case 'FunctionDeclaration':
      case 'IfStatement':
      case 'ExpressionStatement':
      case 'ReturnStatement':
      case 'CallExpression':
      case 'UnaryExpression':
      case 'BinaryExpression':
      case 'LogicalExpression':
      case 'ConditionalExpression':
      case 'FunctionExpression':
      case 'Identifier':
      case 'Literal':
      default:
        return visualizer
    }
  } else {
    switch (evaluator.node.type) {
      case 'VariableDeclaration':
      case 'FunctionDeclaration':
      case 'IfStatement':
      case 'ExpressionStatement':
        const node = evaluator.node as es.ExpressionStatement
        if (calls.isEmpty()) {
          return {
            ...visualizer,
            current: node.expression
          }
        } else {
          return visualizer
        }
      case 'ReturnStatement':
      case 'CallExpression':
      case 'UnaryExpression':
      case 'BinaryExpression':
      case 'LogicalExpression':
      case 'ConditionalExpression':
      case 'FunctionExpression':
      case 'Identifier':
      case 'Literal':
      default:
        return visualizer
    }
  }
}
