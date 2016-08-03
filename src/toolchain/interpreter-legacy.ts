import 'rxjs/add/operator/map'
import 'rxjs/add/operator/filter'
import { Any, Undefined, Snapshot, ISink,
  isForeign, isNever, isTruthy, unbox, box, createError } from './common'

import T = ESTree
type Env = Map<string, any>
type Result = [any, Snapshot]
type Evaluator<N> = (node: N, snapshot: Snapshot) => Any

export class EvaluationError extends Error {
  constructor(public node: T.Node, public message: string) {
    super(message)
  }
}

const isStoppingNode = {
  ReturnStatement: true,
  BreakStatement: true,
  ContinueStatement: true
}

export function init(snapshot: Snapshot, globals: string[]) {
  snapshot.done = false 
  snapshot.value = Undefined
  globals.forEach(key =>
    snapshot.setVar(key, {
      type: 'foreign',
      id: key
    })
  )
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
      value: Object.assign({}, node)
    })
    return Undefined
  },
  FunctionExpression(node: T.FunctionExpression, snapshot: Snapshot) {
    return {
      type: 'function',
      value: Object.assign({}, node)
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
      if (!isTruthy(left)) {
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
    const calleeValue = evaluate(node.callee, snapshot)
    if (calleeValue.type === 'function') {
      return apply(node, calleeValue.value, snapshot)
    } else if (isForeign(calleeValue)) {
      const unboxed = unbox(calleeValue, snapshot.context)
      if (typeof unboxed === 'function') {
        return applyForeign(node, unboxed, snapshot)
      }
    }
    throw new EvaluationError(node, `Cannot apply value of type ${node.type}`)
  },
  Identifier(node: T.Identifier, snapshot: Snapshot) {
    const value = snapshot.getVar(node.name)
    if (isNever(value)) {
      throw new EvaluationError(node, `Undefined variable ${node.name}`)
    } else {
      return value
    }
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
  snapshot.currentNode = node
  if (evaluators.hasOwnProperty(node.type)) {
    return evaluators[node.type](node, snapshot)
  } else {
    return snapshot.value
  }
}

function applyBinaryOperator(operator: string, left: any, right: any): any {
  if (operator === '+') {
    return left + right
  } else if (operator === '-') {
    return left - right
  } else if (operator === '*') {
    return left * right
  } else if (operator === '/') {
    return left / right
  } else if (operator === '%') {
    return left % right
  } else if (operator === '===') {
    return left === right
  } else {
    return left !== right
  }
}

function applyUnaryOperator(operator: string, right: any): any {
  if (operator === '+') {
    return +right
  } else if (operator === '-') {
    return -right
  } else {
    return !right  
  }
}

function apply(
  node: T.CallExpression,
  callee: T.FunctionExpression,
  snapshot: Snapshot
): Any { 
  if (snapshot.callStack.length >= snapshot.maxCallStack) {
    throw new EvaluationError(node, 'Maximum call stack exceeded')
  }
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

function applyForeign(
  node: T.CallExpression,
  callee: Function,
  snapshot: Snapshot
): Any {
  const args: any[] = node.arguments.map((arg) => {
    const value = evaluate(arg, snapshot)
    if (value.type !== 'function') {
      return unbox(value, snapshot.context)
    } else {
      return unboxFunction(snapshot, value.value)
    }
  })
  const result = callee.apply(null, args)
  return box(result)
}

function unboxFunction(snapshot: Snapshot, ast: T.FunctionDeclaration | T.FunctionExpression): Function {  
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
    const result: Any = apply(desugared, callee, snapshot)
    return unbox(result, snapshot)
  }
}

export function createEvaluator(snapshot$: ISink): ISink {
  return snapshot$.map((s) => {
    if (!(s instanceof Snapshot)) { return s }
    const snapshot = <Snapshot> s
    init(snapshot, snapshot.globals || [])
    let value
    try {
      value = evaluate(snapshot.ast, snapshot)
      snapshot.done = true
      snapshot.value = value
      return snapshot
    } catch (e) {
      const err = createError('interpreter', e.node, e.message)
      err.snapshot = snapshot
      return err
    }
  })
}
