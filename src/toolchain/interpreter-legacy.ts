import 'rxjs/add/operator/map'
import 'rxjs/add/operator/filter'
import { Any, Undefined, Snapshot, Snapshot$, ISink,
  isNever, isTruthy, unbox, box, createError, Error$ } from './common'

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
      value: node
    })
    return Undefined
  },
  FunctionExpression(node: T.FunctionExpression, snapshot: Snapshot) {
    return {
      type: 'function',
      value: node
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
    let callee: (T.FunctionExpression | T.FunctionDeclaration)
    if (node.callee.type === 'Identifier') {
      const funVal = snapshot.getVar((<T.Identifier> node.callee).name)
      if (funVal.type === 'foreign') {
        return applyForeign(node, unbox(funVal, snapshot.context), snapshot)
      } else {
        callee = funVal.value
      }
    } else if (node.callee.type === 'FunctionExpression') {
      callee = <T.FunctionExpression> node.callee
    } else {
      throw new EvaluationError(node, `Cannot apply value of type ${node.type}`)
    }
    return apply(node, callee, snapshot)
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
    if (!(arg.type === 'ForeignValue')) {
      const value = evaluate(arg, snapshot)
      if (value.type !== 'function') {
        return unbox(value, snapshot.context)
      } else {
        return unboxFunction(snapshot, value.value)
      }
    } else {
      return arg
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

export function createEvaluator(snapshot$: Snapshot$): ISink {
  const mixed$ = snapshot$.map((s) => {
    let value
    try {
      value = evaluate(s.ast, s)
      s.done = true
      s.value = value
      return s
    } catch (e) {
      if (e.node) {
        const err = createError('interpreter', e.node, e.message)
        err.snapshot = s
        return err
      } else {
        throw e
      }
    }
  })
  return {
    snapshot$: <Snapshot$> mixed$.filter((s) => s instanceof Snapshot),
    error$: <Error$> mixed$.filter((s) => !(s instanceof Snapshot))
  }
}
