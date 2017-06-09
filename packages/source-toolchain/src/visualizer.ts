/**
 * Visualize reductions of expressions.
 */
import * as es from 'estree'
import { Stack } from 'immutable'
import Closure from './Closure'
import { InspectableState } from './evaluatorTypes'
import { createNode, replace } from './astUtils'

const nextId = (() => {
  let num = 0

  return () => {
    num++
    return num
  }
})()

export type VisualizerState = {
  id: number,
  root?: es.Node,
  _suppress: boolean,
  _calls: Stack<es.Node>,
}

/**
 * Create new visualizer interpreter
 */
export const create = (): VisualizerState => ({
  id: nextId(),
  _suppress: true,
  _calls: Stack<es.Node>(),
})

/**
 * Advance visualizer interpreter from interpreter interpreter
 *
 * @param visualizer The visualizer interpreter
 * @param interpreter The interpreter interpreter
 * @returns {VisualizerState} the next visualizer interpreter
 */
export const next = (visualizer: VisualizerState, interpreter: InspectableState): VisualizerState => {
  const { _calls, root, _suppress } = visualizer

  if (!interpreter.node) {
    return visualizer
  }

  if (interpreter._done) {
    switch (interpreter.node.type) {
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
        if (!_suppress && root) {
          return {
            ...visualizer,
            _suppress: false,
            _calls: visualizer._calls.pop(),
          }
        } else {
          return visualizer
        }
      /**
       * When an expression has been completely evaluated,
       * replace the evaluated expression with a node constructor from
       * interpreter value.
       */
      case 'UnaryExpression':
      case 'BinaryExpression':
      case 'LogicalExpression':
      case 'ConditionalExpression':
      case 'Identifier':
        if (interpreter.node.type === 'Identifier' && interpreter.value instanceof Closure) {
          return visualizer
        }
        if (!_suppress && root) {
          const callId = visualizer._calls.peek()
            ? (visualizer._calls.peek() as any).__call
            : undefined
          const toReplace = {...interpreter.node, __call: callId}
          const replaceWith = {...createNode(interpreter.value), __call: callId}
          return {
            ...visualizer,
            id: nextId(),
            root: replace(root, toReplace, replaceWith),
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
    switch (interpreter.node.type) {
      case 'BlockStatement':
        return {
          ...visualizer,
          _suppress: true,
        }
      case 'ExpressionStatement':
        const node = interpreter.node as es.ExpressionStatement
        if (_calls.isEmpty()) {
          return {
            ...visualizer,
            id: nextId(),
            root: node.expression,
            _suppress: false,
          }
        } else {
          return visualizer
        }
      case 'VariableDeclaration':
        const decl = interpreter.node as es.VariableDeclaration
        if (_calls.isEmpty()) {
          return {
            ...visualizer,
            id: nextId(),
            root: decl.declarations[0].init!,
          }
        } else {
          return visualizer
        }
      case 'ReturnStatement':
        const callId = (visualizer._calls.peek() as any).__call
        const argNode = {...interpreter.node.argument!, __call: callId }
        if (root) {
          return {
            ...visualizer,
            id: nextId(),
            root: replace(root, visualizer._calls.peek(), argNode),
            _suppress: false,
          }
        } else {
          return visualizer
        }
      case 'CallExpression':
        const callNode = {...interpreter.node, __call: nextId() }
        return {
          ...visualizer,
          _calls: visualizer._calls.push(callNode),
        }
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
