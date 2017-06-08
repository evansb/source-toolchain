/**
 * Utility functions to work with the AST (Abstract Syntax Tree)
 */
import * as es from 'estree'
import { freshId } from './parser'

/**
 * Check whether two nodes are equal
 * @param n1 First node
 * @param n2 Second node
 */
export const isNodeEqual = (n1: es.Node, n2: es.Node) => {
  if (n1.hasOwnProperty('__id') && n2.hasOwnProperty('__id')) {
    return (n1 as any).__id === (n2 as any).__id
  } else {
    return n1 === n2
  }
}

/**
 * Non-destructively (Immutable) replace a node with another node.
 *
 * @param node The root node to be searched
 * @param before Node to be replaced
 * @param after Replacement node
 */
export const replace = (node: es.Node, before: es.Node, after: es.Node) => {
  const go = (n: es.Node): any => {
    if (isNodeEqual(n, before)) {
      return after
    }
    switch (n.type) {
      case 'Program':
      case 'BlockStatement':
        n = (n as es.BlockStatement)
        return {
          ...n,
          body: n.body.map(go),
        }
      case 'ExpressionStatement':
        n = (n as es.ExpressionStatement)
        return {
          ...n,
          expression: go(n.expression),
        }
      case 'IfStatement':
        n = (n as es.IfStatement)
        return {
          ...n,
          test: go(n.test),
          consequent: go(n.consequent),
          alternate: n.alternate && go(n.alternate),
        }
      case 'FunctionDeclaration':
        n = (n as es.FunctionDeclaration)
        return {
          ...n,
          test: go(n.body),
          consequent: go(n.id),
          params: n.params.map(go),
        }
      case 'VariableDeclaration':
        n = (n as es.VariableDeclaration)
        return {
          ...n,
          declarations: n.declarations.map(go),
        }
      case 'ReturnStatement':
        n = (n as es.ReturnStatement)
        return {
          ...n,
          argument: n.argument && go(n.argument),
        }
      case 'CallExpression':
        n = (n as es.CallExpression)
        return {
          ...n,
          callee: go(n.callee),
          arguements: n.arguments.map(go),
        }
      case 'UnaryExpression':
        n = (n as es.UnaryExpression)
        return {
          ...n,
          argument: go(n.argument),
        }
      case 'BinaryExpression':
        n = (n as es.BinaryExpression)
        return {
          ...n,
          left: go(n.left),
          right: go(n.right),
        }
      case 'LogicalExpression':
        n = (n as es.LogicalExpression)
        return {
          ...n,
          left: go(n.left),
          right: go(n.right),
        }
      case 'ConditionalExpression':
        n = (n as es.ConditionalExpression)
        return {
          ...n,
          test: go(n.test),
          consequent: go(n.consequent),
          alternate: go(n.alternate),
        }
      case 'FunctionExpression':
      case 'Identifier':
      case 'Literal':
        return n
      default:
        return n
    }
  }
  return go(node)
}

const mkLiteralNode = (value: any): es.Node => {
  if (typeof value === 'undefined') {
    return ({
      type: 'Identifier',
      name: 'undefined',
      __id: freshId(),
    }) as any
  } else {
    return ({
      type: 'Literal',
      value,
      raw: value,
      __id: freshId(),
    }) as any
  }
}

export const createNode = (value: any): es.Node => {
  if (value && value.node && value.constructor
      && value.constructor.name === 'Closure') {
    return value.node
  }
  return mkLiteralNode(value)
}
