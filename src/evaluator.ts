import * as es from 'estree'
import { generate } from 'escodegen'
import { List, Record, Stack, Map } from 'immutable'

import { ErrorType, StudentError } from './errorTypes'
import { freshId } from './parser'

export interface Scope {
  parent?: number,
  environment: Map<string, any>,
}

export interface EvaluatorState {
  isRunning: boolean,
  frames: Stack<number>,
  result?: any,
  isReturned?: boolean,
  scopes: Map<number, Scope>
  errors: List<StudentError>,
  value?: any
  expressions: Stack<es.Node>,
  done: boolean,
  node?: es.Node,
}

const initialState: EvaluatorState = {
  isRunning: false,
  frames: Stack<number>(),
  scopes: Map<number, Scope>(),
  result: undefined,
  isReturned: false,
  errors: List<StudentError>(),
  expressions: Stack<es.Node>(),
  value: undefined,
  node: undefined,
  done: false,
}

let frameCtr = 0

export class State extends Record(initialState) implements EvaluatorState {
  isRunning: boolean
  frames: Stack<number>
  scopes: Map<number, Scope>
  result?: any
  isReturned?: boolean
  errors: List<StudentError>
  expressions: Stack<es.Node>
  value?: any
  left?: any
  done: boolean
  node?: es.Node

  popFrame() {
    return this.merge({ frames: this.frames.pop() }) as this
  }

  defineVariable(name: string, value: any) {
    const f = this.frames.peek()
    const scope = this.scopes.get(f)
    return this.merge({
      scopes: this.scopes.set(
        f,
        {
          ...scope,
          environment: scope.environment.set(name, value),
        },
      ),
    }) as this
  }

  pushFrame(scope: Scope) {
    frameCtr++
    return this.merge({
      scopes: this.scopes.set(frameCtr, scope),
      frames: this.frames.push(frameCtr),
    }) as this
  }

  fatalError(error: StudentError) {
    return this.merge({
      errors: this.errors.push(error),
      isRunning: false,
    }) as this
  }

  stop() {
    return this.merge({ isRunning: false }) as this
  }

  start() {
    return this.merge({ isRunning: true }) as this
  }
}

export class Closure {
  constructor(public node: es.FunctionExpression,
              public enclosing: number) {
  }

  createScope(args: any[]): Scope {
    const environment = this.node.params.reduce((s, p, idx) =>
      s.set((p as es.Identifier).name, args[idx])
    , Map<string, any>())
    return {
      parent: this.enclosing,
      environment,
    }
  }
}

export class NativeValue {
  constructor(public value: any, public node: es.Node) {
  }
}

const mkLiteralNode = (value: any): es.Node => {
  let node: any
  if (typeof value === 'undefined') {
    node = {
      type: 'Identifier',
      name: 'undefined',
      __id: freshId(),
    }
  } else {
    node = {
      type: 'Literal',
      value,
      raw: value,
      __id: freshId(),
    }
  }
  return node
}

const mkNode = (value: any, state: State): es.Node => {
  if (value instanceof Closure) {
    return value.node
  }
  if (value instanceof NativeValue) {
    return value.node
  }
  return mkLiteralNode(value)
}

const getEnv = (name: string, state: State) => {
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

export function* evalExpression(node: es.Expression, state: State): any {
  yield state.merge({ node, done: false })

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
      value = new Closure(node, state.frames.first())
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

  yield state.merge({ node })

  if (!selfEvaluating) {
    return state.merge({ done: true })
  } else {
    return state.merge({ done: true, value })
  }
}

function* evalCallExpression(node: es.CallExpression, state: State) {
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

    state = state.pushFrame(callee.createScope(args));

    state = yield* evalBlockStatement(callee.node.body, state)

    return state.popFrame()
  } else {
    const error: StudentError = {
      type: ErrorType.CallingNonFunctionValues,
      node: {
        type: 'AssignmentExpression',
        operator: '=',
        loc: node.callee.loc!,
        left: node.callee as any,
        right: mkNode(callee, state) as es.FunctionExpression,
      },
    }

    return state.fatalError(error)
  }
}

function* evalUnaryExpression(node: es.UnaryExpression, state: State) {
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

  return state.merge({ value })
}

function* evalBinaryExpression(node: es.BinaryExpression, state: State) {
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

  return state.merge({ value: result })
}

function* evalLogicalExpression(node: es.LogicalExpression, state: State) {
  state = yield* evalExpression(node.left, state)
  const left = state.value

  if (node.operator === '&&' && left) {
    return yield* evalExpression(node.right, state)
  } else if (node.operator === '||' && !left) {
    return yield* evalExpression(node.right, state)
  }
}

function* evalConditionalExpression(node: es.ConditionalExpression, state: State) {
  state = yield* evalExpression(node.test, state)

  if (state.value) {
    return yield* evalExpression(node.consequent, state)
  } else {
    return yield* evalExpression(node.alternate, state)
  }
}

export function* evalStatement(node: es.Statement, state: State): any {
  yield state.merge({ node, done: false })

  switch (node.type) {
    case 'VariableDeclaration':
      return yield* evalVariableDeclaration(node, state)
    case 'FunctionDeclaration':
      return yield* evalFunctionDeclaration(node, state)
    case 'IfStatement':
      return yield* evalIfStatement(node, state)
    case 'ExpressionStatement':
      return yield* evalExpressionStatement(node, state)
    case 'ReturnStatement':
      return yield* evalReturnStatement(node, state)
    default:
      return state.merge({ value: undefined })
  }
}

function* evalVariableDeclaration(node: es.VariableDeclaration, state: State) {
  const declarator = node.declarations[0]
  const ident = declarator.id as es.Identifier

  state = yield* evalExpression(declarator.init as es.Expression, state)

  state = state.defineVariable(ident.name, state.value)

  return state.merge({ value: undefined })
}

function* evalFunctionDeclaration(node: es.FunctionDeclaration, state: State) {
  const ident = node.id as es.Identifier
  const closure = new Closure(node as any, state.frames.first())

  state = state.defineVariable(ident.name, closure)

  return state.merge({ value: undefined })
}

function* evalIfStatement(node: es.IfStatement, state: State) {
  state = yield* evalExpression(node.test, state)

  state = state.value
    ? yield* evalBlockStatement(node.consequent as es.BlockStatement, state)
    : yield* evalBlockStatement(node.alternate as es.BlockStatement, state)

  return state
}

function* evalExpressionStatement(node: es.ExpressionStatement, state: State) {
  state = yield* evalExpression(node.expression, state)
  return state
}

function* evalReturnStatement(node: es.ReturnStatement, state: State) {
  state = yield* evalExpression(node.argument as es.Expression, state)
  return state.merge({ isReturned: true })
}

function* evalBlockStatement(node: es.BlockStatement, state: State) {
  for (const stmt of node.body) {
    state = yield* evalStatement(stmt as es.Statement, state)
    if (state.isReturned) {
      break
    }
  }
  return state.merge({ isReturned: false })
}

export function* evalProgram(node: es.Program, state: State) {
  state = yield* evalBlockStatement(node as any, state.start())

  return state.stop()
}
