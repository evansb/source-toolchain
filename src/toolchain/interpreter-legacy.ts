import { Any, Undefined, Snapshot, isTruthy, unbox, box } from './common'

import T = ESTree
type Env = Map<string, any>
type Result = [any, Snapshot]

const isStoppingNode = {
  ReturnStatement: true,
  BreakStatement: true,
  ContinueStatement: true
}

type Evaluator<N> = (node: N, snapshot: Snapshot) => Any

export function init(snapshot: Snapshot, globals: { [index: string]: any }) {
  snapshot.done = false
  for (const key in globals) {
    if (globals.hasOwnProperty(key)) {
      snapshot.setVar(key, {
        type: 'foreign',
        id: key
      })
    }
  }
  snapshot.value = Undefined
}

const evaluators: { [index: string]: Evaluator<any> } = {
  Literal(node: T.Literal, snapshot: Snapshot) {
    return box(node.value)
  },
  ExpressionStatement(node: T.ExpressionStatement, snapshot: Snapshot) {
    return evaluate(node.expression, snapshot)
  },
  BinaryExpression(node: T.BinaryExpression, snapshot: Snapshot) { 
    const right = evaluate(node.right, snapshot)
    const left = evaluate(node.left, snapshot)
    return box(applyBinaryOperator(node.operator,
      unbox(left, snapshot.context),
      unbox(right, snapshot.context)
    ))
  },
  FunctionDeclaration(node: T.FunctionDeclaration, snapshot: Snapshot) {
    const ident = <T.Identifier> node.id
    snapshot.setVar(ident.name, {
      type: 'function',
      value: boxFunction(snapshot, node)
    })
    return Undefined
  },
  FunctionExpression(node: T.FunctionExpression, snapshot: Snapshot) {
    return {
      type: 'function',
      value: boxFunction(snapshot, node)
    }
  },
  Program(node: T.Program, snapshot: Snapshot) {
    return this.BlockStatement(node, snapshot)
  },
  UnaryExpression(node: T.UnaryExpression, snapshot: Snapshot) {
    const value = evaluate(node.argument, snapshot)
    return box(
      applyUnaryOperator(node.operator, unbox(value, snapshot.context)))
  },
  LogicalExpression(node: T.LogicalExpression, snapshot: Snapshot) {
    if (node.operator === '&&') {
      const left = evaluate(node.left, snapshot)
      if (!left) {
        return { type: 'boolean', value: false }
      }
      return evaluate(node.right, snapshot)
    } else {
      const left = evaluate(node.left, snapshot)
      return left || evaluate(node.right, snapshot)
    }
  },
  ConditionalExpression(node: T.ConditionalExpression, snapshot: Snapshot) {
    return this.IfStatement(<T.IfStatement> node, snapshot)
  },
  IfStatement(node: T.IfStatement, snapshot: Snapshot) {
    const predicate = evaluate(node.test, snapshot)
    if (isTruthy(predicate)) {
      return evaluate(node.consequent, snapshot)
    } else {
      return evaluate(node.alternate, snapshot) 
    }
  },
  ReturnStatement(node: T.ReturnStatement, snapshot: Snapshot) {
    return evaluate(node.argument, snapshot)
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
    let callee: Function
    if (node.callee.type === 'Identifier') {
      callee = snapshot.getVar((<T.Identifier> node.callee).name).value
    } else if (node.callee.type === 'ForeignValue') {
      callee = (<any> node.callee).value
    } else if (node.callee.type === 'FunctionExpression') {
      callee = boxFunction(snapshot, <T.FunctionExpression> node.callee)
    }
    const args = Array.prototype.map.call(node.arguments, (n) => {
      if (!(n.type === 'ForeignValue')) {
        return unbox(evaluate(n, snapshot), snapshot)
      } else {
        return (<any> n).value
      }
    })
    const result = callee.apply(null, args)
    return box(result)
  },
  Identifier(node: T.Identifier, snapshot: Snapshot) {
    return snapshot.getVar(node.name)
  },
  VariableDeclaration(node: T.VariableDeclaration, snapshot: Snapshot) {
    return this.VariableDeclarator(node.declarations[0], snapshot)
  },
  VariableDeclarator(node: T.VariableDeclarator, snapshot: Snapshot) {
    const ident = <T.Identifier> node.id
    const val = evaluate(node.init, snapshot)
    snapshot.setVar(ident.name, val)
    return Undefined
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
    case '===': return left === right 
    case '!==': return left === right
    default: return undefined
  }
}

function applyUnaryOperator(operator: string, right: any): any {
  switch (operator) {
    case '+': return +right
    case '-': return -right
    case '!': return !right
    default: return undefined
  }
}

function apply(node: T.CallExpression, snapshot: Snapshot): Any {
  const callee = <T.FunctionExpression> node.callee
  const env = new Map()
  callee.params.forEach((p, idx) => {
    const id = <T.Identifier> p
    const arg = node.arguments[idx] 
    let argVal
    if (!(arg.type === 'ForeignValue')) {
      argVal = evaluate(arg, snapshot)
    } else {
      argVal = arg
    }
    env.set(id.name, argVal)
  })
  snapshot.environment.unshift(env)
  snapshot.callStack.unshift(node)
  const result = evaluate(callee.body, snapshot)
  snapshot.callStack.shift()
  snapshot.environment.shift()
  return result
}

function boxFunction(snapshot: Snapshot,
                     ast: T.FunctionDeclaration | T.FunctionExpression): Function {  
  return function() {
    const args = Array.prototype.map.call(arguments, (e) => {
      return { type: 'ForeignValue', value: e }
    })
    const callee: T.FunctionExpression = {
      loc: ast.loc,
      type: 'FunctionExpression',
      id: ast.id,
      params: ast.params,
      body: ast.body,
      generator: false
    }
    const desugared: T.CallExpression = {
      loc: ast.loc,
      type: 'CallExpression',
      callee,
      arguments: args
    }
    const result: Any = apply(desugared, snapshot)
    return unbox(result, snapshot)
  }
}
