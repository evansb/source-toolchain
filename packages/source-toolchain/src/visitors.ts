import * as es from 'estree'

import { ErrorType } from './errorTypes'

export type Visitor<S extends es.Node> = {
  before: (parent: es.Node | undefined, node: S) => void,
  after: (parent: es.Node | undefined, node: S) => void,
}

export function noop<S>(parent: es.Node | undefined, node: S): void {
  return
}

export const NOOP = {
  before: noop,
  after: noop,
}

export type Visitors = {
  skip?: boolean,
  Program: Visitor<es.Program>,
  ExpressionStatement: Visitor<es.ExpressionStatement>,
  IfStatement: Visitor<es.IfStatement>,
  FunctionDeclaration: Visitor<es.FunctionDeclaration>,
  VariableDeclaration: Visitor<es.VariableDeclaration>,
  ReturnStatement: Visitor<es.ReturnStatement>,

  Literal: Visitor<es.Literal>,
  Identifier: Visitor<es.Identifier>,
  CallExpression: Visitor<es.CallExpression>,
  UnaryExpression: Visitor<es.UnaryExpression>,
  BinaryExpression: Visitor<es.BinaryExpression>,
  LogicalExpression: Visitor<es.LogicalExpression>,
  ConditionalExpression: Visitor<es.ConditionalExpression>,
  FunctionExpression: Visitor<es.FunctionExpression>,

  onError(error: ErrorType, parent: es.Node, node: es.Node | null | undefined): void,
}

function* visitCallExpression(node: es.CallExpression, visitors: Visitors) {
  for (const exp of node.arguments) {
    yield* visitExpression(node, exp as any, visitors)
  }
  yield* visitExpression(node, node.callee as any, visitors)
}

function* visitExpression(parent: es.Node, node: es.Expression, visitors: Visitors): any {
  switch (node.type) {
    case 'CallExpression':
      yield visitors.CallExpression.before(parent, node)
      yield* visitCallExpression(node, visitors)
      yield visitors.CallExpression.after(parent, node)
      break
    case 'UnaryExpression':
      yield* visitUnaryExpression(node, visitors)
      yield visitors.UnaryExpression.after(parent, node)
      break
    case 'BinaryExpression':
      yield visitors.BinaryExpression.before(parent, node)
      yield* visitBinaryExpression(node, visitors)
      yield visitors.BinaryExpression.after(parent, node)
      break
    case 'LogicalExpression':
      yield visitors.LogicalExpression.before(parent, node)
      yield* visitLogicalExpression(node, visitors)
      yield visitors.LogicalExpression.after(parent, node)
      break
    case 'ConditionalExpression':
      yield visitors.ConditionalExpression.before(parent, node)
      yield* visitConditionalExpression(node, visitors)
      yield visitors.ConditionalExpression.after(parent, node)
      break
    case 'FunctionExpression':
      yield visitors.FunctionExpression.before(parent, node)
      yield* visitFunctionExpression(node, visitors)
      yield visitors.FunctionExpression.after(parent, node)
      break
    case 'Identifier':
      yield visitors.Identifier.before(parent, node)
      yield visitors.Identifier.after(parent, node)
      break
    case 'Literal':
      yield visitors.Literal.before(parent, node)
      yield visitors.Literal.after(parent, node)
      break
    default:
      yield visitors.onError(ErrorType.MatchFailure, parent, node)
  }
}

function* visitUnaryExpression(node: es.UnaryExpression, visitors: Visitors) {
  yield* visitExpression(node, node.argument, visitors)
}

function* visitBinaryExpression(node: es.BinaryExpression, visitors: Visitors) {
  yield* visitExpression(node, node.left, visitors)
  yield* visitExpression(node, node.right, visitors)
}

function* visitLogicalExpression(node: es.LogicalExpression, visitors: Visitors) {
  yield* visitExpression(node, node.left, visitors)
  yield* visitExpression(node, node.right, visitors)
}

function* visitConditionalExpression(node: es.ConditionalExpression, visitors: Visitors) {
  yield* visitExpression(node, node.test, visitors)
  yield* visitExpression(node, node.consequent, visitors)
  yield* visitExpression(node, node.alternate, visitors)
}

function* visitFunctionExpression(node: es.FunctionExpression, visitors: Visitors) {
  if (!visitors.skip) {
    yield* visitBlockStatement(node, node.body, visitors)
  }
}

function* visitIfStatement(node: es.IfStatement, visitors: Visitors) {
  yield* visitExpression(node, node.test, visitors)
  if (node.consequent) {
    if (node.consequent.type === 'BlockStatement') {
      yield* visitBlockStatement(node, node.consequent as any, visitors)
    } else {
      yield* visitStatement(node, node.consequent, visitors)
    }
  }
  if (node.alternate) {
    if (node.alternate.type === 'BlockStatement') {
      yield* visitBlockStatement(node, node.alternate as any, visitors)
    } else {
      yield* visitStatement(node, node.alternate, visitors)
    }
  }
}

function* visitFunctionDeclaration(node: es.FunctionDeclaration, visitors: Visitors) {
  yield* visitBlockStatement(node, node.body, visitors)
}

function* visitVariableDeclaration(node: es.VariableDeclaration, visitors: Visitors) {
  if (node.declarations.length === 1) {
    const declarator = node.declarations[0]
    if (declarator.id.type !== 'Identifier') {
      yield visitors.onError(ErrorType.DeclaratorNotIdentifier, node, declarator)
    } else {
      yield* visitExpression(node, declarator.init as es.Expression, visitors)
    }
  } else {
    yield visitors.onError(ErrorType.DeclaratorNotIdentifier, node, null)
  }
}

function* visitReturnStatement(node: es.ReturnStatement, visitors: Visitors) {
  yield* visitExpression(node, node.argument as any, visitors)
}

function* visitStatement(parent: es.Node, node: es.Statement, visitors: Visitors): any {
  switch (node.type) {
    case 'ExpressionStatement':
      yield visitors.ExpressionStatement.before(parent, node)
      yield* visitExpressionStatement(node, visitors)
      yield visitors.ExpressionStatement.after(parent, node)
      break
    case 'IfStatement':
      yield visitors.IfStatement.before(parent, node)
      yield* visitIfStatement(node, visitors)
      yield visitors.IfStatement.after(parent, node)
      break
    case 'FunctionDeclaration':
      yield visitors.FunctionDeclaration.before(parent, node)
      yield* visitFunctionDeclaration(node, visitors)
      yield visitors.FunctionDeclaration.after(parent, node)
      break
    case 'VariableDeclaration':
      yield visitors.VariableDeclaration.before(parent, node)
      yield* visitVariableDeclaration(node, visitors)
      yield visitors.VariableDeclaration.after(parent, node)
      break
    case 'ReturnStatement':
      yield visitors.ReturnStatement.before(parent, node)
      yield* visitReturnStatement(node, visitors)
      yield visitors.ReturnStatement.after(parent, node)
      break
    default:
      yield visitors.onError(ErrorType.MatchFailure, parent, node)
      break
  }
}

function* visitExpressionStatement(node: es.ExpressionStatement, visitors: Visitors) {
  yield* visitExpression(node, node.expression, visitors)
}

function* visitBlockStatement(parent: es.Node | undefined, node: es.BlockStatement, visitors: Visitors) {
  for (const stmt of node.body) {
    yield* visitStatement(node, stmt as any, visitors)
  }
}

export function* visitProgram(node: es.Program, visitors: Visitors) {
  yield visitors.Program.before(undefined, node)
  for (const stmt of node.body) {
    yield* visitStatement(node, stmt as any, visitors)
  }
  yield visitors.Program.after(undefined, node)
}
