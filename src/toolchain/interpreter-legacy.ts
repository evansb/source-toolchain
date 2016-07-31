import { Map, Stack } from 'immutable'
import { Value, Snapshot } from './common'

import T = ESTree
type Env = Map<string, any>
type Result = [any, Snapshot]

const isStoppingNode = {
  ReturnStatement: true,
  BreakStatement: true,
  ContinueStatement: true
}

type Evaluator<N> = (node: N, snapshot: Snapshot, context: any) => Snapshot

export function init(snapshot: Snapshot,
                     globals: { [index: string]: Value }): Snapshot {
  return <Snapshot> snapshot.set('environment', Stack.of(Map(globals)))
}

const evaluators: { [index: string]: Evaluator<any> } = {
  Literal(node: T.Literal, snapshot: Snapshot) {
    return <Snapshot> snapshot.set('value', {
      type: node.type,
      value: node.value
    })
  },
  ExpressionStatement(node: T.ExpressionStatement, snapshot: Snapshot, context: any) {
    return evaluate(node.expression, snapshot, context)
  },
  VariableDeclaration(node: T.VariableDeclaration, snapshot: Snapshot, context: any) {
    const declaration = node.declarations[0]
    const { name } = <T.Identifier> declaration.id
    const snapshot2 = evaluate(declaration.init, snapshot, context)
    return snapshot.setVar(name, snapshot2.value)
  },
  BinaryExpression(node: T.BinaryExpression, snapshot: Snapshot, context: any) { 
    const rightEff = evaluate(node.right, snapshot, context)
    const leftEff = evaluate(node.left, rightEff, context)
    const result = applyBinaryOperator(node.operator,
      snapshot.unbox(leftEff.value, context),
      snapshot.unbox(rightEff.value, context)
    )
    return <Snapshot> leftEff.set('value', snapshot.box(result))
  },  
  Program(node: T.Program, snapshot: Snapshot) {
    return this.BlockStatement(node, snapshot)
  },
  BlockStatement(node: T.BlockStatement, snapshot: Snapshot, context: any) {
    let lastSnapshot = snapshot
    node.body.some((n) => {
      lastSnapshot = evaluate(n, lastSnapshot, context)
      return isStoppingNode[n.type]
    })
    return lastSnapshot
  },
  CallExpression(node: T.CallExpression, snapshot: Snapshot, context: any) {
    return snapshot
  },
  Identifier(node: T.Identifier, snapshot: Snapshot) {
    return <Snapshot> snapshot.set('value', snapshot.getVar(node.name))
  }
}

export function evaluate(node: T.Node, snapshot: Snapshot, context: any): Snapshot {
  if (evaluators.hasOwnProperty(node.type)) {
    return evaluators[node.type](node, snapshot, context)
  } else {
    return snapshot
  }
}

function applyBinaryOperator(operator: string, left: any, right: any): any {
  switch (operator) {
    case '+': return left + right
    case '-': return left - right
    case '*': return left * right
    case '/': return left / right 
    case '%': return left / right
    default: return undefined
  }
}
