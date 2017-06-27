import * as invariant from 'invariant'
import * as es from 'estree'
import { recursive, base, Walker, Walkers } from 'acorn/dist/walk'
import { generate } from 'astring'
import { stripIndent } from 'common-tags'

import { IError } from './types/error'
import {
  StaticState,
  ITypeError,
  CFG,
  undefinedT,
  numberT,
  anyT,
  booleanT,
  stringT
} from './types/static'

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

export class TypeError<T extends es.Node> implements ITypeError {
  constructor(
    public node: T,
    public expected: CFG.Type[],
    public got: CFG.Type,
    public proof?: es.Node
  ) {}

  get location() {
    return this.node.loc!
  }

  explain() {
    return `Unexpected type: ${this.got}`
  }

  elaborate() {
    return ''
  }
}

export class UndeclaredVariable implements IError {
  constructor(public node: es.Identifier) {}

  get location() {
    return this.node.loc!
  }

  explain() {
    return `Undeclared variable ${this.node.name}`
  }

  elaborate() {
    return 'TODO'
  }
}

export class VariableRedeclaration implements IError {
  constructor(public node: es.VariableDeclaration, proof: es.Node) {}

  get location() {
    return this.node.loc!
  }

  get name() {
    return (this.node.declarations[0].id as any).name
  }

  explain() {
    return `Redeclaring variable ${this.name}`
  }

  elaborate() {
    return 'TODO'
  }
}

export class NonNumberInBinaryArithmeticExpression extends TypeError<
  es.BinaryExpression
> {
  constructor(
    node: es.BinaryExpression,
    got: CFG.Type,
    public leftOrRight: 'left' | 'right',
    proof?: es.Node
  ) {
    super(node, [numberT], got, proof)
  }

  explain() {
    return `Non-number in ${this.leftOrRight} hand side of ${this.node
      .operator} operation.`
  }

  elaborate() {
    return 'TODO'
  }
}

export class NonNumberInUnaryArithmeticExpression extends TypeError<
  es.UnaryExpression
> {
  constructor(node: es.UnaryExpression, got: CFG.Type, proof?: es.Node) {
    super(node, [numberT], got, proof)
  }

  explain() {
    return `Non-number in unary ${this.node.operator} operation.`
  }

  elaborate() {
    return 'TODO'
  }
}

export class NonBooleanInLogicalExpression extends TypeError<
  es.LogicalExpression
> {
  constructor(
    node: es.LogicalExpression,
    got: CFG.Type,
    public leftOrRight: 'left' | 'right',
    public proof?: es.Node
  ) {
    super(node, [booleanT], got, proof)
  }

  explain() {
    return `Non-boolean in ${this.leftOrRight} hand side of ${super.node
      .operator} operation.`
  }

  elaborate() {
    return 'TODO'
  }
}

export class CallingNonFunctionValue extends TypeError<es.CallExpression> {
  constructor(
    node: es.CallExpression,
    expected: CFG.Type,
    got: CFG.Type,
    proof?: es.Node
  ) {
    super(node, [expected], got, proof)
  }

  explain() {
    return 'Calling non-function value'
  }

  elaborate() {
    return 'TODO'
  }
}

export class InvalidNumberOfArguments extends TypeError<es.CallExpression> {
  constructor(
    node: es.CallExpression,
    expected: CFG.Type,
    got: CFG.Type,
    proof?: es.Node
  ) {
    super(node, [expected], got, proof)
  }

  explain() {
    return 'Invalid number of arguments supplied'
  }

  elaborate() {
    return 'TODO'
  }
}

export class NonBooleanInConditionalExpressionTest extends TypeError<
  es.ConditionalExpression
> {
  constructor(node: es.ConditionalExpression, got: CFG.Type, proof?: es.Node) {
    super(node, [booleanT], got, proof)
  }

  explain() {
    return 'Non-boolean in conditional expression test'
  }

  elaborate() {
    return 'TODO'
  }
}

export class NonBooleanInIfTest extends TypeError<es.Expression> {
  constructor(node: es.Expression, got: CFG.Type, proof?: es.Node) {
    super(node, [booleanT], got, proof)
  }

  explain() {
    return 'Non-boolean in "if" test'
  }

  elaborate() {
    return 'TODO'
  }
}

export class InconsistentTypeInConditionalExpression extends TypeError<
  es.Expression
> {
  constructor(
    node: es.Expression,
    expected: CFG.Type,
    got: CFG.Type,
    proof?: es.Node
  ) {
    super(node, [expected], got, proof)
  }

  explain() {
    return 'Inconsistent type in "else" case of conditional expression.'
  }

  elaborate() {
    return 'TODO'
  }
}

export class InvalidCallArguments extends TypeError<es.CallExpression> {
  constructor(
    node: es.CallExpression,
    public position: number,
    expected: CFG.Type,
    got: CFG.Type,
    proof?: es.Node
  ) {
    super(node, [expected], got, proof)
  }

  explain() {
    return 'Invalid Call Arguments'
  }

  elaborate() {
    return 'TODO'
  }
}

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
    // TODO fix this
    throw new CallingNonFunctionValue(node, calleeType, calleeType, calleeProof)
  }

  if (node.arguments.length < calleeType.params!.length) {
    // TODO fix this
    throw new InvalidNumberOfArguments(
      node,
      calleeType,
      calleeType,
      calleeProof
    )
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
      throw new InvalidCallArguments(node, idx, param, argType, argProof)
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
    throw new NonBooleanInConditionalExpressionTest(node, testType, testProof)
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
    throw new InconsistentTypeInConditionalExpression(
      node.alternate,
      consType,
      altType,
      altProof
    )
  }
}

checkers.UnaryExpression = (node: es.UnaryExpression, state) => {
  const { type: argType, proof: argProof } = checkers[node.argument.type](
    node,
    state,
    numberT
  )
  if (argType !== numberT) {
    throw new NonNumberInUnaryArithmeticExpression(node, argType, argProof)
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
    throw new NonNumberInBinaryArithmeticExpression(
      node,
      right,
      'right',
      rightProof
    )
  } else {
    throw new NonNumberInBinaryArithmeticExpression(
      node,
      left,
      'left',
      leftProof
    )
  }
}

checkers.VariableDeclaration = (node: es.VariableDeclaration, state) => {
  const ident = node.declarations[0].id as es.Identifier
  const existing = currentScope.env[ident.name]
  if (existing) {
    throw new VariableRedeclaration(node, existing.proof)
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
    throw new UndeclaredVariable(node)
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
    throw new NonBooleanInLogicalExpression(node, leftType, 'left', leftProof)
  }
  if (rightType !== booleanT) {
    throw new NonBooleanInLogicalExpression(
      node,
      rightType,
      'right',
      rightProof
    )
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
    throw new NonBooleanInIfTest(node.test, testType, testProof)
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
        if (e instanceof TypeError || (e as IError).location) {
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
