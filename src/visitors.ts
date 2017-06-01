import * as es from 'estree'

import { ErrorType } from './errorTypes'

export type Visitor<S extends es.Node, T> = {
  before: (parent: es.Node | undefined, node: S) => T,
  after: (parent: es.Node | undefined, node: S) => T,
}

export function noop<S>(parent: es.Node | undefined, node: S): void {
  return
}

export type Visitors<T> = {
  skip?: boolean,
  Program: Visitor<es.Program, T>,
  ExpressionStatement: Visitor<es.ExpressionStatement, T>,
  IfStatement: Visitor<es.IfStatement, T>,
  FunctionDeclaration: Visitor<es.FunctionDeclaration, T>,
  VariableDeclaration: Visitor<es.VariableDeclaration, T>,
  ReturnStatement: Visitor<es.ReturnStatement, T>,

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
  yield* visitExpression(node, node.callee as any, visitors)
}

export function* visitExpression<T>(parent: es.Node, node: es.Expression, visitors: Visitors<T>): any {
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
  if (!visitors.skip) {
    yield* visitBlockStatement(node, node.body, visitors)
  }
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
      yield visitors.onError(ErrorType.DeclaratorNotIdentifier, node, declarator)
    } else {
      yield* visitExpression(node, declarator.init as es.Expression, visitors)
    }
  } else {
    yield visitors.onError(ErrorType.DeclaratorNotIdentifier, node, null)
  }
}

export function* visitReturnStatement<T>(node: es.ReturnStatement, visitors: Visitors<T>) {
  yield* visitExpression(node, node.argument as any, visitors)
}

export function* visitStatement<T>(parent: es.Node, node: es.Statement, visitors: Visitors<T>): any {
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

export function* visitExpressionStatement<T>(node: es.ExpressionStatement, visitors: Visitors<T>) {
  yield* visitExpression(node, node.expression, visitors)
}

export function* visitBlockStatement<T>(parent: es.Node | undefined, node: es.BlockStatement, visitors: Visitors<T>) {
  for (const stmt of node.body) {
    yield* visitStatement(node, stmt as any, visitors)
  }
}

export function* visitProgram<T>(node: es.Program, visitors: Visitors<T>) {
  yield visitors.Program.before(undefined, node)
  for (const stmt of node.body) {
    yield* visitStatement(node, stmt as any, visitors)
  }
  yield visitors.Program.after(undefined, node)
}
