import * as invariant from 'invariant'
import * as es from 'estree'
import { recursive, base, Walker, Walkers } from 'acorn/dist/walk'
import { generate } from 'escodegen'
import { stripIndent } from 'common-tags'

import { ErrorType } from './types/error'
import {
  StaticState,
  TypeError,
  CFG,
  undefinedT,
  numberT,
  anyT,
  booleanT,
  stringT
} from './types/static'

class Stop {}

let currentScope: CFG.Scope

// Helper functions
const isSameFunctionType = (t1: CFG.Type, t2: CFG.Type) => {
  if (t1.name !== 'function' || t2.name !== 'function') {
    return false
  }
  if (t1.params && t1.params.length !== (t2.params && t2.params.length)) {
    return false
  }
  for (let i = 0; i < t1.params!.length; i++) {
    if (!isSameType(t1.params![i], t2.params![i])) {
      return false
    }
  }
  return isSameType(t1.returnType!, t2.returnType!)
}
const isFunction = (t: CFG.Type): boolean => t.hasOwnProperty('params')

export const isSameType = (t1: CFG.Type, t2: CFG.Type): boolean =>
  t1 === anyT || t2 === anyT || t1 === t2 || isSameFunctionType(t1, t2)

export const parseString = (str: string): CFG.Type => {
  if (str === 'number') {
    return numberT
  } else if (str === 'string') {
    return stringT
  } else if (str === 'any') {
    return anyT
  } else if (str === 'boolean') {
    return booleanT
  } else {
    // TODO
    return { name: 'function' }
  }
}

type Checker<T extends es.Node> = (
  node: T,
  state: StaticState,
  expectation?: CFG.Type
) => ({ type: CFG.Type; proof: es.Node })

const checkers: { [name: string]: Checker<any> } = {}

const initFunctionType = (node: es.Function, state: StaticState): CFG.Type => {
  const scope = state.cfg.scopes.find(s => s.node === node)!
  scope.type = {
    name: 'function',
    params: node.params.map(_ => anyT),
    returnType: anyT
  }
  return scope.type
}

const nonNumbersInArithmeticBinaryExpression = (
  node: es.Node,
  got: CFG.Type,
  proof: es.Node
): TypeError => ({
  kind: 'type',
  type: ErrorType.NonNumbersInArithmeticBinaryExpression,
  node,
  expected: [stringT, numberT],
  proof,
  got
})

const logicalExpressionNotBoolean = (
  node: es.Node,
  got: CFG.Type,
  proof: es.Node
): TypeError => ({
  kind: 'type',
  type: ErrorType.LogicalExpressionNotBoolean,
  node,
  got,
  proof,
  expected: [booleanT]
})

checkers.Literal = (node: es.Literal, state) => {
  switch (typeof node.value) {
    case 'number':
      return { type: numberT, proof: node }
    case 'string':
      return { type: stringT, proof: node }
    case 'boolean':
      return { type: booleanT, proof: node }
    default:
      return { type: anyT, proof: node }
  }
}

checkers.CallExpression = (node: es.CallExpression, state, expected) => {
  const paramTypes: CFG.Type[] = []
  const paramProofs: es.Node[] = []

  const { type: calleeType, proof: calleeProof } = checkers[node.callee.type](
    node.callee,
    state
  )

  if (!isFunction(calleeType)) {
    state.cfg.errors.push({
      kind: 'type',
      type: ErrorType.CallingNonFunctionValues,
      node: node.callee,
      expected: [],
      got: calleeType,
      proof: calleeProof
    })
    throw new Stop()
  }

  if (node.arguments.length < calleeType.params!.length) {
    state.cfg.errors.push({
      kind: 'type',
      type: ErrorType.InvalidNumberOfArguments,
      node,
      expected: [],
      got: anyT,
      proof: calleeProof
    })
  }

  const expectations = calleeType.params!

  node.arguments.forEach((argument, idx) => {
    let param = calleeType.params![idx]
    const { type: argType, proof: argProof } = checkers[argument.type](
      argument,
      state,
      param
    )
    // Narrow argument type
    if (param === anyT) {
      param = calleeType.params![idx] = argType
    }
    if (!isSameType(argType, param)) {
      state.cfg.errors.push({
        kind: 'type',
        type: ErrorType.InvalidCallArguments,
        node: argument,
        expected: [param],
        got: argType,
        proof: argProof
      })
      throw new Stop()
    }
  })

  // Narrow callee type
  if (calleeType.returnType === anyT && expected && expected !== anyT) {
    calleeType.returnType = expected
  }

  return { type: calleeType.returnType!, proof: node }
}

checkers.ConditionalExpression = (node: es.ConditionalExpression, state) => {
  const { type: testType, proof: testProof } = checkers[node.test.type](
    node.test,
    state,
    booleanT
  )
  if (testType !== booleanT) {
    state.cfg.errors.push({
      kind: 'type',
      type: ErrorType.ConditionalExpressionTestNotBoolean,
      node: node.test,
      expected: [booleanT],
      got: testType,
      proof: testProof
    })
    throw new Stop()
  }
  const { type: consType, proof: constProof } = checkers[node.consequent.type](
    node.consequent,
    state
  )
  const { type: altType, proof: altProof } = checkers[node.alternate.type](
    node.alternate,
    state,
    consType
  )
  if (isSameType(consType, altType)) {
    return { type: consType, proof: node }
  } else {
    state.cfg.errors.push({
      kind: 'type',
      type: ErrorType.InconsistentTypeInConditionalExpression,
      node: node.alternate,
      expected: [consType],
      got: altType,
      proof: altProof
    })
    throw new Stop()
  }
}

checkers.UnaryExpression = (node: es.UnaryExpression, state) => {
  const { type: argType, proof: argProof } = checkers[node.argument.type](
    node,
    state,
    numberT
  )
  if (argType !== numberT) {
    state.cfg.errors.push({
      kind: 'type',
      type: ErrorType.NonNumbersInArithmeticUnaryExpression,
      node: node.argument,
      expected: [numberT],
      got: argType,
      proof: argProof
    })
    throw new Stop()
  }
  return { type: argType, proof: node }
}

checkers.BinaryExpression = (node: es.BinaryExpression, state) => {
  const { type: left, proof: leftProof } = checkers[node.left.type](
    node.left,
    state,
    numberT
  )
  const { type: right, proof: rightProof } = checkers[node.right.type](
    node.right,
    state,
    numberT
  )
  if (left === numberT && right === numberT) {
    return { type: numberT, proof: node }
  } else if (left === numberT) {
    state.cfg.errors.push(
      nonNumbersInArithmeticBinaryExpression(node.right, right, rightProof)
    )
    throw new Stop()
  } else {
    state.cfg.errors.push(
      nonNumbersInArithmeticBinaryExpression(node.left, left, leftProof)
    )
    throw new Stop()
  }
}

checkers.VariableDeclaration = (node: es.VariableDeclaration, state) => {
  const ident = node.declarations[0].id as es.Identifier
  if (currentScope.env[ident.name]) {
    state.cfg.errors.push({
      kind: 'syntax',
      type: ErrorType.VariableRedeclaration,
      node
    })
    throw new Stop()
  }
  const init = node.declarations[0].init!
  const { type: initType, proof: initProof } = checkers[init.type](init, state)
  currentScope.env[ident.name] = {
    name: ident.name,
    type: initType,
    proof: initProof,
    definedAt: node.loc!
  }
  return { type: undefinedT, proof: node }
}

const getSymbol = (name: string) => {
  let scope: CFG.Scope | undefined = currentScope
  while (scope) {
    if (scope.env.hasOwnProperty(name)) {
      return scope.env[name]
    } else {
      scope = scope.parent
    }
  }
  return undefined
}

checkers.Identifier = (node: es.Identifier, state, expected) => {
  const symbol = getSymbol(node.name)
  if (!symbol) {
    state.cfg.errors.push({
      kind: 'syntax',
      type: ErrorType.UndefinedVariable,
      node
    })
    throw new Stop()
  }
  if (symbol.type === anyT && expected && expected !== anyT) {
    symbol.type = expected
  }
  return { type: symbol.type, proof: node }
}

checkers.FunctionExpression = (node: es.FunctionExpression, state) => ({
  type: initFunctionType(node, state),
  proof: node
})

checkers.FunctionDeclaration = (node: es.FunctionDeclaration, state) => {
  // Infer the most general type of the function first
  // The type is narrowed by subsequent calls.
  const type = initFunctionType(node, state)
  currentScope.env[node.id.name] = {
    name: node.id.name,
    type,
    definedAt: node.loc!,
    proof: node
  }
  if (currentScope.node === node) {
    currentScope.type = type
  }
  return { type: undefinedT, proof: node }
}

checkers.ReturnStatement = (node: es.ReturnStatement, state) => {
  const { type: argType, proof: argProof } = checkers[node.argument!.type](
    node.argument!,
    state,
    currentScope.type.returnType!
  )
  if (isSameType(currentScope.type.returnType!, argType)) {
    currentScope.type.returnType = argType
    currentScope.proof = argProof
  }
  return { type: undefinedT, proof: node }
}

checkers.LogicalExpression = (node: es.LogicalExpression, state) => {
  const { type: leftType, proof: leftProof } = checkers[node.left.type](
    node.left,
    state,
    booleanT
  )
  const { type: rightType, proof: rightProof } = checkers[node.right.type](
    node.right,
    state,
    booleanT
  )
  if (leftType !== booleanT) {
    state.cfg.errors.push(
      logicalExpressionNotBoolean(node, leftType, leftProof)
    )
    throw new Stop()
  }
  if (rightType !== booleanT) {
    state.cfg.errors.push(
      logicalExpressionNotBoolean(node, rightType, rightProof)
    )
    throw new Stop()
  }
  return { type: booleanT, proof: node }
}

checkers.IfStatement = (node: es.IfStatement, state) => {
  const { type: testType, proof: testProof } = checkers[node.test.type](
    node,
    state,
    booleanT
  )
  if (testType !== booleanT) {
    state.cfg.errors.push({
      kind: 'type',
      type: ErrorType.IfTestNotBoolean,
      node: node.test,
      proof: testProof,
      expected: [booleanT],
      got: testType
    })
  }
  return { type: undefinedT, proof: node }
}

checkers.ExpressionStatement = (node: es.ExpressionStatement, state) => {
  checkers[node.expression.type](node.expression, state)
  return { type: undefinedT, proof: node }
}

export const typecheck = (state: StaticState) => {
  const checked: { [id: string]: boolean } = {}
  for (const scope of state.cfg.scopes) {
    currentScope = scope
    const queue = [scope.entry]
    if (scope.node && scope.node.type !== 'Program') {
      const func = scope.node as es.Function
      func.params.forEach((p, idx) => {
        const id = p as es.Identifier
        scope.env[id.name] = {
          name: id.name,
          type: scope.type.params![idx],
          proof: id,
          definedAt: id.loc!
        }
      })
    }
    while (queue.length > 0) {
      const current = queue.shift()!
      // Check current
      try {
        checkers[current.node.type](current.node, state)
      } catch (e) {
        if (e instanceof Stop) {
          return
        } else {
          throw e
        }
      }
      checked[current.id] = true
      const next = state.cfg.edges[current.id]
      for (const next of state.cfg.edges[current.id]) {
        if (!checked[next.to.id]) {
          queue.push(next.to)
        }
      }
    }
  }
}
