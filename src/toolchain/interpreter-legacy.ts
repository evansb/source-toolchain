import { Any, Undefined, Snapshot, unbox, box } from './common'

import T = ESTree
type Env = Map<string, any>
type Result = [any, Snapshot]

const isStoppingNode = {
  ReturnStatement: true,
  BreakStatement: true,
  ContinueStatement: true
}

type Evaluator<N> = (node: N, snapshot: Snapshot) => Any

export function init(snapshot: Snapshot, globals: Map<string, Any>) {
  snapshot.done = false
  snapshot.environment = [globals]
  snapshot.value = Undefined
}

const evaluators: { [index: string]: Evaluator<any> } = {
  Literal(node: T.Literal, snapshot: Snapshot) {
    return box(node.value)
  },
  ExpressionStatement(node: T.ExpressionStatement, snapshot: Snapshot) {
    return evaluate(node.expression, snapshot)
  },
  VariableDeclaration(node: T.VariableDeclaration, snapshot: Snapshot) {
    const declaration = node.declarations[0]
    const { name } = <T.Identifier> declaration.id
    const value = evaluate(declaration.init, snapshot)
    snapshot.setVar(name, value)
    return Undefined
  },
  BinaryExpression(node: T.BinaryExpression, snapshot: Snapshot) { 
    const right = evaluate(node.right, snapshot)
    const left = evaluate(node.left, snapshot)
    return box(applyBinaryOperator(node.operator,
      unbox(left, snapshot.context),
      unbox(right, snapshot.context)
    ))
  },  
  Program(node: T.Program, snapshot: Snapshot) {
    return this.BlockStatement(node, snapshot)
  },
  BlockStatement(node: T.BlockStatement, snapshot: Snapshot) {
    let lastValue: Any = Undefined
    node.body.some((n) => {
      lastValue = evaluate(n, snapshot)
      return isStoppingNode[n.type]
    })
    return lastValue
  },
  CallExpression(node: T.CallExpression, snapshot: Snapshot) {
    return Undefined
  },
  Identifier(node: T.Identifier, snapshot: Snapshot) {
    return snapshot.getVar(node.name)
  }
}

export function evaluate(node: T.Node, snapshot: Snapshot): Any {
  if (evaluators.hasOwnProperty(node.type)) {
    return evaluators[node.type](node, snapshot)
  } else {
    return snapshot.value
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
