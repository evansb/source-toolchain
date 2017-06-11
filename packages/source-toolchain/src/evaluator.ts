import * as es from 'estree'
import { List, Record, Stack, Map } from 'immutable'

import { Scope, EvaluatorState } from './evaluatorTypes'
import { ErrorType, StudentError } from './errorTypes'
import { createNode } from './astUtils'
import Closure from './Closure'

const initialState: EvaluatorState = {
  isRunning: false,
  frames: Stack<number>(),
  scopes: Map<number, Scope>(),
  errors: List<StudentError>(),
  node: undefined,
  value: undefined,

  _isReturned: false,
  _done: false,
}

let frameCtr = 0
let lambdaCtr = 0

export class InterpreterState extends Record(initialState) implements EvaluatorState {
  isRunning: boolean
  frames: Stack<number>
  scopes: Map<number, Scope>
  errors: List<StudentError>
  value?: any
  node?: es.Node

  // tslint:disable:variable-name
  _isReturned?: boolean
  _done: boolean

  with(params: Partial<EvaluatorState>) {
    return this.merge(params) as this
  }
}

/**
 * Create initial interpreter interpreter with global environment.
 *
 * @returns {InterpreterState}
 */
export const createState = (): InterpreterState => {
  const globalEnv: Scope = {
    name: '_global_',
    parent: undefined,
    environment: Map<string, any>(),
  }

  return new InterpreterState({
    _done: false,
    _isReturned: false,
    _result: undefined,
    isRunning: false,
    frames: Stack.of(0),
    scopes: Map.of(0, globalEnv),
    errors: List(),
    value: undefined,
    node: undefined,
  })
}

const stop = (state: InterpreterState): InterpreterState =>
  state.with({ isRunning: false })

const start = (state: InterpreterState): InterpreterState =>
  state.with({ isRunning: true })

const defineVariable = (state: InterpreterState, name: string, value: any): InterpreterState => {
  const currentFrame = state.frames.peek()
  const scope = state.scopes.get(currentFrame)
  return state.with({
    scopes: state.scopes.set(
      currentFrame,
      {
        ...scope,
        environment: scope.environment.set(name, value),
      },
    ),
  })
}

const popFrame = (state: InterpreterState): InterpreterState =>
  state.with({ frames: state.frames.pop() })

const pushFrame = (state: InterpreterState, scope: Scope): InterpreterState => {
  frameCtr++
  return state.with({
    scopes: state.scopes.set(frameCtr, scope),
    frames: state.frames.push(frameCtr),
  })
}

const fatalError = (state: InterpreterState, error: StudentError): InterpreterState => {
  return state.with({
    errors: state.errors.push(error),
    isRunning: false,
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

export function* evalExpression(node: es.Expression, state: InterpreterState): any {
  yield state.with({ node, _done: false })

  let value: any
  let selfEvaluating = false

  switch (node.type) {
    case 'CallExpression':
      state = yield* evalCallExpression(node, state)
      break
    case 'UnaryExpression':
      state = yield* evalUnaryExpression(node, state)
      break
    case 'BinaryExpression':
      state = yield* evalBinaryExpression(node, state)
      break
    case 'LogicalExpression':
      state = yield* evalLogicalExpression(node, state)
      break
    case 'ConditionalExpression':
      state = yield* evalConditionalExpression(node, state)
      break
    case 'FunctionExpression':
      value = new Closure(node, state.frames.first(), lambdaCtr)
      lambdaCtr++
      selfEvaluating = true
      break
    case 'Identifier':
      value = getEnv(node.name, state)
      selfEvaluating = true
      break
    case 'Literal':
      value = node.value
      selfEvaluating = true
      break
    default:
      break
  }

  if (selfEvaluating) {
    const nextState = state.with({ _done: true, node, value })
    yield nextState
    return nextState
  } else {
    yield state.with({ _done: true, node })
    return state
  }
}

function* evalCallExpression(node: es.CallExpression, state: InterpreterState) {
  // Evaluate Callee
  state = yield* evalExpression(node.callee as any, state)
  const callee = state.value

  // Internal Function Call
  if (callee instanceof Closure) {
    const args: any[] = []

    // Evaluate each arguments from left to right
    for (const exp of node.arguments) {
      state = yield* evalExpression(exp as es.Expression, state)
      args.push(state.value)
    }

    state = pushFrame(state, callee.createScope(args))

    yield state.with({ _done: false, node: callee.node.body })

    state = yield* evalBlockStatement(callee.node.body, state)

    yield state.with({ _done: true, node: callee.node.body })

    return popFrame(state).merge({ _done: true })
  } else {
    const error: StudentError = {
      type: ErrorType.CallingNonFunctionValues,
      node: {
        type: 'AssignmentExpression',
        operator: '=',
        loc: node.callee.loc!,
        left: node.callee as any,
        right: createNode(callee) as es.FunctionExpression,
      },
    }

    return fatalError(state, error)
  }
}

function* evalUnaryExpression(node: es.UnaryExpression, state: InterpreterState) {
  let value
  state = yield* evalExpression(node.argument, state)

  // tslint:disable-next-line
  if (node.operator === '!') {
    value = !state.value
  } else if (node.operator === '-') {
    value = -state.value
  } else {
    value =  +state.value
  }

  return state.with({ _done: true, value })
}

function* evalBinaryExpression(node: es.BinaryExpression, state: InterpreterState) {
  state = yield* evalExpression(node.left, state)
  const left = state.value
  state = yield* evalExpression(node.right, state)
  const right = state.value

  let result
  switch (node.operator) {
    case '+':
      result = left + right
      break
    case '-':
      result = left - right
      break
    case '*':
      result = left * right
      break
    case '/':
      result = left / right
      break
    case '%':
      result = left % right
      break
    case '===':
      result = left === right
      break
    case '!==':
      result = left !== right
      break
    case '<=':
      result = left <= right
      break
    case '<':
      result = left < right
      break
    case '>':
      result = left > right
      break
    case '>=':
      result = left >= right
      break
    default:
      result = undefined
  }

  return state.with({ value: result })
}

function* evalLogicalExpression(node: es.LogicalExpression, state: InterpreterState) {
  state = yield* evalExpression(node.left, state)
  const left = state.value

  if (node.operator === '&&' && left) {
    state =  yield* evalExpression(node.right, state)
  } else if (node.operator === '||' && !left) {
    state = yield* evalExpression(node.right, state)
  }

  return state
}

function* evalConditionalExpression(node: es.ConditionalExpression, state: InterpreterState) {
  state = yield* evalExpression(node.test, state)

  if (state.value) {
    return yield* evalExpression(node.consequent, state)
  } else {
    return yield* evalExpression(node.alternate, state)
  }
}

export function* evalStatement(node: es.Statement, state: InterpreterState): any {
  yield state.with({ node, _done: false })

  switch (node.type) {
    case 'VariableDeclaration':
      state = yield* evalVariableDeclaration(node, state)
      break
    case 'FunctionDeclaration':
      state = yield* evalFunctionDeclaration(node, state)
      break
    case 'IfStatement':
      state = yield* evalIfStatement(node, state)
      break
    case 'ExpressionStatement':
      state = yield* evalExpressionStatement(node, state)
      break
    case 'ReturnStatement':
      state = yield* evalReturnStatement(node, state)
      break
    default:
      break
  }

  return state.with({ _done: true, node })
}

function* evalVariableDeclaration(node: es.VariableDeclaration, state: InterpreterState) {
  const declarator = node.declarations[0]
  const ident = declarator.id as es.Identifier

  state = yield* evalExpression(declarator.init as es.Expression, state)

  state = defineVariable(state, ident.name, state.value)

  return state.with({ value: undefined })
}

function* evalFunctionDeclaration(node: es.FunctionDeclaration, state: InterpreterState) {
  const ident = node.id as es.Identifier
  const closure = new Closure(node as any, state.frames.first())

  state = defineVariable(state, ident.name, closure)

  return state.with({ value: undefined })
}

function* evalIfStatement(node: es.IfStatement, state: InterpreterState) {
  state = yield* evalExpression(node.test, state)

  state = state.value
    ? yield* evalBlockStatement(node.consequent as es.BlockStatement, state)
    : yield* evalBlockStatement(node.alternate as es.BlockStatement, state)

  return state
}

function* evalExpressionStatement(node: es.ExpressionStatement, state: InterpreterState) {
  state = yield* evalExpression(node.expression, state)
  return state
}

function* evalReturnStatement(node: es.ReturnStatement, state: InterpreterState) {
  state = yield* evalExpression(node.argument as es.Expression, state)
  return state.with({ _isReturned: true })
}

function* evalBlockStatement(node: es.BlockStatement, state: InterpreterState) {
  for (const stmt of node.body) {
    state = yield* evalStatement(stmt as es.Statement, state)
    if (state._isReturned) {
      break
    }
  }
  return state.with({ _isReturned: false })
}

export function* evalProgram(node: es.Program, state: InterpreterState) {
  state = yield* evalBlockStatement(node as any, start(state))

  return stop(state)
}
