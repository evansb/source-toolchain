import * as invariant from 'invariant'
import * as es from 'estree'
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

// Helper functions
const isSameFunctionType = (t1: CFG.Type, t2: CFG.Type) => {
  if (t1.params && t1.params.length !== (t2.params && t2.params.length)) {
    return false
  }
  for (let i = 0; i < t1.params!.length; i++) {
    if (!isSameType(t1.params![i], t1.params![i])) {
      return false
    }
  }
  return true
}
const isFunction = (t: CFG.Type): boolean => t.hasOwnProperty('params')

const isSameType = (t1: CFG.Type, t2: CFG.Type): boolean =>
  t1 === anyT || t2 === anyT || t1 === t2 || isSameFunctionType(t1, t2)

type Checker<T extends es.Node> = (
  node: T,
  state: StaticState
) => ({ type: CFG.Type; proof: es.Node })

const checkers: { [name: string]: Checker<any> } = {}

const fvbe = (node: es.Node, got: CFG.Type, proof: es.Node): TypeError => ({
  kind: 'type',
  type: ErrorType.FunctionValuesInBinaryExpression,
  node,
  expected: [stringT, numberT],
  proof,
  got
})

const lenb = (node: es.Node, got: CFG.Type, proof: es.Node): TypeError => ({
  kind: 'type',
  type: ErrorType.LogicalExpressionNotBoolean,
  node,
  got,
  proof,
  expected: [booleanT]
})

checkers.Literal = (node: es.Literal, state) => {
  const type = { name: typeof node.value } as CFG.Type
  return { type, proof: node }
}

checkers.CallExpression = (node: es.CallExpression, state) => {
  const paramTypes: CFG.Type[] = []
  const paramProofs: es.Node[] = []

  node.arguments.forEach(a => {
    const { type: argType, proof: argProof } = checkers[a.type](a, state)
    paramTypes.push(argType)
    paramProofs.push(argProof)
  })
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
  } else {
    calleeType.params!.forEach((t, idx) => {
      const got = paramTypes[idx]
      if (!isSameType(t, got)) {
        state.cfg.errors.push({
          kind: 'type',
          type: ErrorType.InvalidCallArguments,
          node: node.arguments[idx],
          expected: [t],
          got: got,
          proof: paramProofs[idx]
        })
        throw new Stop()
      }
    })
    return { type: calleeType.returnType!, proof: node }
  }
}

checkers.ConditionalExpression = (node: es.ConditionalExpression, state) => {
  const { type: testType, proof: testProof } = checkers[node.test.type](
    node.test,
    state
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
    state
  )
  if (isSameType(consType, altType)) {
    return { type: consType, proof: node }
  } else {
    state.cfg.errors.push({
      kind: 'type',
      type: ErrorType.ConditionalExpressionNotSame,
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
    state
  )
  if (argType !== numberT) {
    state.cfg.errors.push({
      kind: 'type',
      type: ErrorType.UnaryExpressionArgumentNotNumber,
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
  const { type: left, proof: leftProof } = checkers[node.left.type](node, state)
  const { type: right, proof: rightProof } = checkers[node.right.type](
    node,
    state
  )

  if (isFunction(left)) {
    state.cfg.errors.push(fvbe(node.left, left, leftProof))
    throw new Stop()
  } else if (isFunction(right)) {
    state.cfg.errors.push(fvbe(node.right, right, rightProof))
    throw new Stop()
  } else {
    return { type: left, proof: node }
  }
}

checkers.VariableDeclaration = (node: es.VariableDeclaration, state) => {
  const ident = node.declarations[0].id as es.Identifier
  const init = node.declarations[0].init!
  const { type: initType, proof: initProof } = checkers[init.type](init, state)
  const vertex = state.cfg.scopes[0].env[ident.name]
  if (vertex) {
    vertex.type = initType
    vertex.proof = initProof
  }
  return { type: undefinedT, proof: node }
}

checkers.FunctionExpression = (node: es.FunctionExpression, state) => {
  const scope = state.cfg.scopes.find(s => s.node === node)!
  return { type: scope.type!, proof: node }
}

checkers.FunctionDeclaration = (node: es.FunctionDeclaration, state) => {
  const scope = state.cfg.scopes.find(s => s.node === node)!
  state.cfg.scopes[0].env[node.id.name].type = scope.type
  return { type: undefinedT, proof: node }
}

checkers.ReturnStatement = (node: es.ReturnStatement, state) => {
  const scope = state.cfg.scopes[0]
  const { type: argType, proof: argProof } = checkers[node.argument!.type](
    node.argument!,
    state
  )
  if (isSameType(scope.type, argType)) {
    scope.type = argType
    scope.proof = argProof
  }
  return { type: undefinedT, proof: node }
}

checkers.LogicalExpression = (node: es.LogicalExpression, state) => {
  const { type: leftType, proof: leftProof } = checkers[node.left.type](
    node.left,
    state
  )
  const { type: rightType, proof: rightProof } = checkers[node.left.type](
    node.right,
    state
  )
  if (leftType !== booleanT) {
    state.cfg.errors.push(lenb(node, leftType, leftProof))
  }
  if (rightType !== booleanT) {
    state.cfg.errors.push(lenb(node, rightType, rightProof))
  }
  if (!isSameType(leftType, rightType)) {
    state.cfg.errors.push({
      kind: 'type',
      node: node.right,
      type: ErrorType.LogicalExpressionNotSameType,
      got: rightType,
      expected: [leftType],
      proof: rightProof
    })
    throw new Stop()
  }
  return { type: rightType, proof: rightProof }
}

checkers.IfStatement = (node: es.IfStatement, state) => {
  const { type: testType, proof: testProof } = checkers[node.test.type](
    node,
    state
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
  checkers[node.type](node.expression, state)
  return { type: undefinedT, proof: node }
}
