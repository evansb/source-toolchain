import * as es from 'estree'
import { generate } from 'escodegen'
import { List, Record, Stack, Map } from 'immutable'

import { ErrorType, StudentError, Scope, Scheduler,
  EvaluatorState, Step } from './types'
import { freshId } from './parser'

const initialState: EvaluatorState = {
  isRunning: false,
  frames: Stack<number>(),
  scopes: Map<number, Scope>(),
  result: undefined,
  isReturned: false,
  errors: List<StudentError>(),
  expressions: Stack<es.Node>(),
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
  let value: any
  let selfEvaluating = false

  switch (node.type) {
    case 'CallExpression':
      [value, state] = yield* evalCallExpression(node, state)
      break
    case 'UnaryExpression':
      [value, state] = yield* evalUnaryExpression(node, state)
      break
    case 'BinaryExpression':
      [value, state] = yield* evalBinaryExpression(node, state)
      break
    case 'LogicalExpression':
      [value, state] = yield* evalLogicalExpression(node, state)
      break
    case 'ConditionalExpression':
      [value, state] = yield* evalConditionalExpression(node, state)
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

  if (!selfEvaluating) {
    const step: Step = {
      state,
      before: node,
      after: mkNode(value, state),
    }

    yield step
  }

  return [value, state]
}

function* evalCallExpression(node: es.CallExpression, state: State): IterableIterator<Step> {
  // Evaluate Callee
  let callee;
  [callee, state] = yield* evalExpression(node.callee as any, state)

  // Internal Function Call
  if (callee instanceof Closure) {
    let result: any
    const args: any[] = []

    // Evaluate each arguments from left to right
    for (const exp of node.arguments) {
      [result, state] = yield* evalExpression(exp as es.Expression, state)
      args.push(result)
    }

    state = state.pushFrame(callee.createScope(args));

    [result, state] = yield* evalBlockStatement(callee.node.body, state)

    return [result, state.popFrame()]
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

    return [undefined, state.fatalError(error)]
  }
}

function* evalUnaryExpression(node: es.UnaryExpression, state: State) {
  let value
  [value, state] = yield* evalExpression(node.argument, state)

  // tslint:disable-next-line
  if (node.operator === '!') {
    value = !value
  } else if (node.operator === '-') {
    value = -value
  } else {
    value =  +value
  }

  return [value, state]
}

function* evalBinaryExpression(node: es.BinaryExpression, state: State) {
  let left
  let right
  let result

  [left, state] = yield* evalExpression(node.left, state);
  [right, state] = yield* evalExpression(node.right, state)

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

  return [result, state]
}

function* evalLogicalExpression(node: es.LogicalExpression, state: State) {
  let left

  [left, state] = yield* evalExpression(node.left, state)

  if (node.operator === '&&' && left) {
    return yield* evalExpression(node.right, state)
  } else if (node.operator === '||' && !left) {
    return yield* evalExpression(node.right, state)
  }
}

function* evalConditionalExpression(node: es.ConditionalExpression, state: State) {
  let test

  [test, state] = yield* evalExpression(node.test, state)

  if (test) {
    return yield* evalExpression(node.consequent, state)
  } else {
    return yield* evalExpression(node.alternate, state)
  }
}

export function* evalStatement(node: es.Statement, state: State): any {
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
      return [undefined, state]
  }
}

function* evalVariableDeclaration(node: es.VariableDeclaration, state: State) {
  let value
  const declarator = node.declarations[0]
  const ident = declarator.id as es.Identifier

  [value, state] = yield* evalExpression(declarator.init as es.Expression, state)

  state = state.defineVariable(ident.name, value)

  const step: Step = {
    state,
    before: node,
    after: mkNode(undefined, state),
  }

  yield step

  return [undefined, state]
}

function* evalFunctionDeclaration(node: es.FunctionDeclaration, state: State) {
  const ident = node.id as es.Identifier
  const closure = new Closure(node as any, state.frames.first())

  state = state.defineVariable(ident.name, closure)

  yield {
    state,
    before: node,
    after: mkNode(undefined, state),
  }

  return [undefined, state]
}

function* evalIfStatement(node: es.IfStatement, state: State) {
  let value: any
  [value, state] = yield* evalExpression(node.test, state);

  [value, state] = value
    ? yield* evalBlockStatement(node.consequent as es.BlockStatement, state)
    : yield* evalBlockStatement(node.alternate as es.BlockStatement, state)

  yield {
    state,
    before: node,
    after: mkNode(value, state),
  }

  return [value, state]
}

function* evalExpressionStatement(node: es.ExpressionStatement, state: State) {
  return yield* evalExpression(node.expression, state)
}

function* evalReturnStatement(node: es.ReturnStatement, state: State) {
  let value
  [value, state] = yield* evalExpression(node.argument as es.Expression, state)
  return [value, state.merge({ isReturned: true })]
}

function* evalBlockStatement(node: es.BlockStatement, state: State) {
  let result

  for (const stmt of node.body) {
    [result, state] = yield* evalStatement(stmt as es.Statement, state)
    if (state.isReturned) {
      break
    }
  }

  return [result, state.merge({ isReturned: false })]
}

export function* evalProgram(node: es.Program, state: State) {
  let result

  [result, state] = yield* evalBlockStatement(node as any, state.start())

  return [result, state.stop()]
}

export const evaluate = <T>(program: es.Program, scheduler: Scheduler<T>) => {
  const globalScope: Scope = {
    parent: undefined,
    environment: Map<string, any>(),
  }

  const state: State = new State({
    isRunning: false,
    frames: Stack.of(globalScope),
    errors: [],
    expressions: [],
  })

  const stepper = evalProgram(program, state)

  return scheduler(state, stepper)
}
