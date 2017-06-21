import * as es from 'estree'
import { List, Stack, Map } from 'immutable'

import { Scope, InterpreterState } from './types/dynamic'
import { createNode } from './astUtils'
import Closure from './Closure'

let frameCtr = 0
let lambdaCtr = 0

/**
 * Create initial interpreter interpreter with global environment.
 *
 * @returns {InterpreterState}
 */
export const createInterpreter = (): InterpreterState => {
  const globalEnv: Scope = {
    name: '_global_',
    parent: undefined,
    environment: Map<string, any>()
  }

  return new InterpreterState({
    _done: false,
    _isReturned: false,
    _result: undefined,
    isRunning: true,
    frames: Stack.of(0),
    scopes: Map.of(0, globalEnv),
    errors: List(),
    value: undefined,
    node: undefined
  })
}

const stop = (state: InterpreterState): InterpreterState =>
  state.with({ isRunning: false })

const start = (state: InterpreterState): InterpreterState =>
  state.with({ isRunning: true })

const defineVariable = (
  state: InterpreterState,
  name: string,
  value: any
): InterpreterState => {
  const currentFrame = state.frames.peek()
  const scope = state.scopes.get(currentFrame)
  return state.with({
    scopes: state.scopes.set(currentFrame, {
      ...scope,
      environment: scope.environment.set(name, value)
    })
  })
}

const popFrame = (state: InterpreterState) =>
  state.with({ frames: state.frames.pop() })

const pushFrame = (state: InterpreterState, scope: Scope) => {
  frameCtr++
  return state.with({
    scopes: state.scopes.set(frameCtr, scope),
    frames: state.frames.push(frameCtr)
  })
}

const getEnv = (name: string, state: InterpreterState) => {
  let scope = state.scopes.get(state.frames.peek())

  do {
    if (scope.environment.has(name)) {
      return scope.environment.get(name)
    } else {
      scope = state.scopes.get(scope.parent!)
    }
  } while (scope)

  return undefined
}

export type Evaluator<T extends es.Node> =
  (node: T, state: InterpreterState) => IterableIterator<InterpreterState>

export const evaluators: {[nodeType: string]: Evaluator<any>} = {}
const ev = evaluators

ev.FunctionExpression = function*(node: es.FunctionExpression, state) {
  yield (state = state.with({ _done: false, node }))
  const closure = new Closure(node, state.frames.first(), lambdaCtr)
  yield (state = state.with({ _done: true, node, value: closure }))
  return state
}

ev.Identifier = function*(node: es.Identifier, state) {
  yield (state = state.with({ _done: false, node }))
  yield (state = state.with({ _done: true, node, value: getEnv(node.name, state) }))
  return state
}

ev.Literal = function*(node: es.Literal, state) {
  yield (state = state.with({ _done: false, node }))
  yield (state = state.with({ _done: true, node, value: node.value }))
  return state
}

ev.CallExpression = function* (node: es.CallExpression, state) {
  yield (state = state.with({ _done: false, node }))

  // Evaluate Callee
  state = yield* ev[node.callee.type](node.callee, state)
  const callee = state.value

  // Internal Function Call
  if (callee instanceof Closure) {
    const args: any[] = []

    // Evaluate each arguments from left to right
    for (const exp of node.arguments) {
      state = yield* ev[exp.type](exp, state)
      args.push(state.value)
    }

    state = pushFrame(state, callee.createScope(args))
    yield (state = state.with({ _done: false, node: callee.node.body }))

    state = yield* ev.BlockStatement(callee.node.body, state)

    yield (state = popFrame(state).with({ _done: true, node }))

    return state 
  } else {
    // TODO: Native Closure
    return state
  }
}

ev.UnaryExpression = function*(node: es.UnaryExpression, state) {
  yield (state = state.with({ _done: false, node }))
  state = yield* ev[node.argument.type](node.argument, state)

  let value
  // tslint:disable-next-line
  if (node.operator === '!') {
    value = !state.value
  } else if (node.operator === '-') {
    value = -state.value
  } else {
    value = +state.value
  }

  yield (state = state.with({ _done: true, node, value }))

  return state 
}

ev.BinaryExpression = function*(node: es.BinaryExpression, state) {
  yield (state = state.with({ _done: false, node }))

  state = yield* ev[node.left.type](node.left, state)
  const left = state.value
  state = yield* ev[node.right.type](node.right, state)
  const right = state.value

  let result
  switch (node.operator) {
    case '+': result = left + right; break
    case '-': result = left - right; break
    case '*': result = left * right; break
    case '/': result = left / right; break
    case '%': result = left % right; break
    case '===': result = left === right; break
    case '!==': result = left !== right; break
    case '<=': result = left <= right; break
    case '<': result = left < right; break
    case '>': result = left > right; break
    case '>=': result = left >= right; break
    default: result = undefined
  }

  yield (state = state.with({ _done: true, node, value: result }))

  return state
}

ev.LogicalExpression = function*(node: es.LogicalExpression, state) {
  yield (state = state.with({ _done: false, node }))

  state = yield* ev[node.left.type](node.left, state)
  const left = state.value

  if ((node.operator === '&&' && left)
        || (node.operator === '||' && !left)) {
    state = yield* ev[node.right.type](node.right, state)
  } 

  yield (state = state.with({ _done: true, node }))

  return state
}

ev.ConditionalExpression = function*(node: es.ConditionalExpression, state) {
  yield (state = state.with({ _done: false, node }))
  state = yield* ev[node.test.type](node.test, state)

  if (state.value) {
    state = yield* ev[node.consequent.type](node.consequent, state)
  } else {
    state = yield* ev[node.alternate.type](node.alternate, state)
  }

  yield (state = state.with({ _done: true, node }))
  return state
}

ev.VariableDeclaration = function*(node: es.VariableDeclaration, state) {
  const declaration = node.declarations[0]
  const id = declaration.id as es.Identifier

  state = yield* ev[declaration.init!.type](declaration.init, state)
  state = defineVariable(state, id.name, state.value)

  return state.with({ value: undefined })
}

ev.FunctionDeclaration = function*(node: es.FunctionDeclaration, state) {
  const id = node.id as es.Identifier
  const closure = new Closure(node as any, state.frames.first())

  state = defineVariable(state, id.name, closure)

  return state.with({ value: undefined })
}

ev.IfStatement = function*(node: es.IfStatement, state) {
  state = yield* ev[node.test.type](node.test, state)

  if (state.value) {
    state = yield* ev[node.consequent.type](node.consequent, state)
  } else if (node.alternate) {
    state = yield* ev[node.alternate.type](node.alternate, state)
  }

  return state
}

ev.ExpressionStatement = function*(node: es.ExpressionStatement, state) {
  return yield* ev[node.expression.type](node.expression, state)
}

ev.ReturnStatement = function*(node: es.ReturnStatement, state) {
  if (node.argument) {
    state = yield* ev[node.argument.type](node.argument, state)
  }
  return state.with({ _isReturned: true })
}

ev.BlockStatement = function*(node: es.BlockStatement, state) {
  for (const statement of node.body) {
    yield (state = state.with({ _done: false, node: statement }))
    state = yield* ev[statement.type](statement, state)

    if (state._isReturned) {
      break
    }
  }
  return state.with({ _isReturned: false })
}

export function* evalProgram(node: es.Program, state: InterpreterState) {
  state = yield* ev.BlockStatement(node as any, start(state))

  return stop(state)
}
