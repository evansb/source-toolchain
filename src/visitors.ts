import * as es from 'estree'

import { ErrorType } from './errors'

export type Visitor<S extends es.Node, T> = {
  before: (parent: es.Node | undefined, node: S) => T,
  after: (parent: es.Node | undefined, node: S) => T,
}

export function noop<S>(parent: es.Node | undefined, node: S): void {
  return
}

export type Visitors<T> = {
  Program: Visitor<es.Program, T>,
  ExpressionStatement: Visitor<es.ExpressionStatement, T>,
  IfStatement: Visitor<es.IfStatement, T>,
  FunctionDeclaration: Visitor<es.FunctionDeclaration, T>,
  VariableDeclaration: Visitor<es.VariableDeclaration, T>,
  ReturnStatement: Visitor<es.ReturnStatement, T>,

  Expression: Visitor<es.Expression, T>,
  Literal: Visitor<es.Literal, T>,
  Identifier: Visitor<es.Identifier, T>,
  CallExpression: Visitor<es.CallExpression, T>,
  UnaryExpression: Visitor<es.UnaryExpression, T>,
  BinaryExpression: Visitor<es.BinaryExpression, T>,
  LogicalExpression: Visitor<es.LogicalExpression, T>,
  ConditionalExpression: Visitor<es.ConditionalExpression, T>,
  FunctionExpression: Visitor<es.FunctionExpression, T>,

  onError(error: ErrorType, parent: es.Node, node: es.Node | null | undefined): T,
}

export function* visitCallExpression<T>(node: es.CallExpression, visitors: Visitors<T>) {
  for (const exp of node.arguments) {
    yield* visitExpression(node, exp as any, visitors)
  }
}

export function* visitExpression<T>(parent: es.Node, node: es.Expression, visitors: Visitors<T>): any {
  switch (node.type) {
    case 'CallExpression':
      visitors.CallExpression.before(parent, node)
      yield* visitCallExpression(node, visitors)
      visitors.CallExpression.after(parent, node)
      break
    case 'UnaryExpression':
      yield* visitUnaryExpression(node, visitors)
      visitors.UnaryExpression.after(parent, node)
      break
    case 'BinaryExpression':
      visitors.BinaryExpression.before(parent, node)
      yield* visitBinaryExpression(node, visitors)
      visitors.BinaryExpression.after(parent, node)
      break
    case 'LogicalExpression':
      visitors.LogicalExpression.before(parent, node)
      yield* visitLogicalExpression(node, visitors)
      visitors.LogicalExpression.after(parent, node)
      break
    case 'ConditionalExpression':
      visitors.ConditionalExpression.before(parent, node)
      yield* visitConditionalExpression(node, visitors)
      visitors.ConditionalExpression.after(parent, node)
      break
    case 'FunctionExpression':
      visitors.FunctionExpression.before(parent, node)
      yield* visitFunctionExpression(node, visitors)
      visitors.FunctionExpression.after(parent, node)
      break
    case 'Identifier':
      visitors.Identifier.after(parent, node)
      break
    case 'Literal':
      visitors.Literal.after(parent, node)
      break
    default:
      visitors.onError(ErrorType.MatchFailure, parent, node)
  }
}

export function* visitUnaryExpression<T>(node: es.UnaryExpression, visitors: Visitors<T>) {
  yield* visitExpression(node, node.argument, visitors)
}

export function* visitBinaryExpression<T>(node: es.BinaryExpression, visitors: Visitors<T>) {
  yield* visitExpression(node, node.left, visitors)
  yield* visitExpression(node, node.right, visitors)
}

export function* visitLogicalExpression<T>(node: es.LogicalExpression, visitors: Visitors<T>) {
  yield* visitExpression(node, node.left, visitors)
  yield* visitExpression(node, node.right, visitors)
}

export function* visitConditionalExpression<T>(node: es.ConditionalExpression, visitors: Visitors<T>) {
  yield* visitExpression(node, node.test, visitors)
  yield* visitExpression(node, node.consequent, visitors)
  yield* visitExpression(node, node.alternate, visitors)
}

export function* visitFunctionExpression<T>(node: es.FunctionExpression, visitors: Visitors<T>) {
  yield* visitBlockStatement(node, node.body, visitors)
}

export function* visitIfStatement<T>(node: es.IfStatement, visitors: Visitors<T>) {
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

export function* visitFunctionDeclaration<T>(node: es.FunctionDeclaration, visitors: Visitors<T>) {
  yield* visitBlockStatement(node, node.body, visitors)
}

export function* visitVariableDeclaration<T>(node: es.VariableDeclaration, visitors: Visitors<T>) {
  if (node.declarations.length === 1) {
    const declarator = node.declarations[0]
    if (declarator.id.type !== 'Identifier') {
      visitors.onError(ErrorType.DeclaratorNotIdentifier, node, declarator)
    } else {
      yield* visitExpression(node, declarator.init as es.Expression, visitors)
    }
  } else {
    visitors.onError(ErrorType.DeclaratorNotIdentifier, node, null)
  }
}

export function* visitReturnStatement<T>(node: es.ReturnStatement, visitors: Visitors<T>) {
  yield* visitExpression(node, node.argument as any, visitors)
}

export function* visitStatement<T>(parent: es.Node, node: es.Statement, visitors: Visitors<T>): any {
  switch (node.type) {
    case 'ExpressionStatement':
      visitors.ExpressionStatement.before(parent, node)
      yield* visitExpressionStatement(node, visitors)
      visitors.ExpressionStatement.after(parent, node)
      break
    case 'IfStatement':
      visitors.IfStatement.before(parent, node)
      yield* visitIfStatement(node, visitors)
      visitors.IfStatement.after(parent, node)
      break
    case 'FunctionDeclaration':
      visitors.FunctionDeclaration.before(parent, node)
      yield* visitFunctionDeclaration(node, visitors)
      visitors.FunctionDeclaration.after(parent, node)
      break
    case 'VariableDeclaration':
      visitors.VariableDeclaration.before(parent, node)
      yield* visitVariableDeclaration(node, visitors)
      visitors.VariableDeclaration.after(parent, node)
      break
    case 'ReturnStatement':
      visitors.ReturnStatement.before(parent, node)
      yield* visitReturnStatement(node, visitors)
      visitors.ReturnStatement.after(parent, node)
      break
    default:
      visitors.onError(ErrorType.MatchFailure, parent, node)
      break
  }
}

export function* visitExpressionStatement<T>(node: es.ExpressionStatement, visitors: Visitors<T>) {
  yield* visitExpression(node, node.expression, visitors)
}

export function* visitBlockStatement<T>(parent: es.Node | undefined, node: es.BlockStatement, visitors: Visitors<T>) {
  for (const stmt of node.body) {
    yield* visitStatement(node, stmt as any, visitors)
  }
}

export function* visitProgram<T>(node: es.Program, visitors: Visitors<T>) {
  visitors.Program.before(undefined, node)
  for (const stmt of node.body) {
    yield* visitStatement(node, stmt as any, visitors)
  }
  visitors.Program.after(undefined, node)
}
