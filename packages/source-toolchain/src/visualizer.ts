/**
 * Visualize reductions of expressions.
 */
import * as es from 'estree'
import { Stack } from 'immutable'
import { InspectableState } from './evaluatorTypes'
import { createNode, replace } from './astUtils'

export type VisualizerState = {
  suppress: boolean
  root?: es.Node
  calls: Stack<es.Node>
}

export const create = (): VisualizerState => ({
  suppress: false,
  calls: Stack<es.Node>(),
})

export const next = (visualizer: VisualizerState, evaluator: InspectableState): VisualizerState => {
  const { calls, root, suppress } = visualizer

  if (!evaluator.node) {
    return visualizer
  }

  if (evaluator._done) {
    switch (evaluator.node.type) {
      /**
       * Do nothing after statement.
       */
      case 'VariableDeclaration':
      case 'FunctionDeclaration':
      case 'IfStatement':
      case 'ExpressionStatement':
      case 'ReturnStatement':
        return visualizer
      case 'CallExpression':
        if (!suppress && root) {
          const parent = visualizer.calls.peek()
          const toReplace = evaluator.node
          const replaceWith = createNode(evaluator.value)
          return {
            ...visualizer,
            suppress: false,
            root: replace(parent, toReplace, replaceWith),
            calls: visualizer.calls.pop(),
          }
        } else {
          return visualizer
        }
      /**
       * When an expression has been completely evaluated,
       * replace the evaluated expression with a node constructor from
       * evaluator value.
       */
      case 'UnaryExpression':
      case 'BinaryExpression':
      case 'LogicalExpression':
      case 'ConditionalExpression':
      case 'Identifier':
        if (!suppress && root) {
          const toReplace = evaluator.node
          const replaceWith = createNode(evaluator.value)
          return {
            ...visualizer,
            root: replace(root, toReplace, replaceWith)
          }
        } else {
          return visualizer
        }
      // Self evaluating expression need not be visualized
      case 'Literal':
      case 'FunctionExpression':
      default:
        return visualizer
    }
  } else {
    switch (evaluator.node.type) {
      case 'ExpressionStatement':
        const node = evaluator.node as es.ExpressionStatement
        if (calls.isEmpty()) {
          return {
            ...visualizer,
            root: node.expression,
          }
        } else {
          return visualizer
        }
      case 'VariableDeclaration':
        const decl = evaluator.node as es.VariableDeclaration
        if (calls.isEmpty()) {
          return {
            ...visualizer,
            root: decl.declarations[0].init!,
          }
        } else {
          return visualizer
        }
      case 'ReturnStatement':
      case 'CallExpression':
      case 'FunctionDeclaration':
      case 'IfStatement':
      case 'UnaryExpression':
      case 'BinaryExpression':
      case 'LogicalExpression':
      case 'ConditionalExpression':
      case 'Identifier':
      case 'FunctionExpression':
      default:
        return visualizer
    }
  }
}
