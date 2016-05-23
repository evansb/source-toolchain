/**
 * JediScript untyped AST and their factories.
 */
import assign = require('object-assign')

// The naming of these syntax types must follow ESTree specification
// https://github.com/estree/estree/blob/master/spec.md
export enum SyntaxType {
  AnonymousFunction,
  Literal,
  Identifier,
  IfStatement,
  BinaryExpression,
  LogicalExpression,
  UnaryOperation,
  WhileStatement,
  ForStatement,
  BreakStatement,
  ContinueStatement,
  ReturnStatement,
  VariableDefinition,
  VariableAssignment,
  PropertyAssignment,
  FunctionDefinition,
  FunctionApplication,
  ObjectMethodApplication,
  ObjectConstruction
}

export enum BooleanOp {
  And,
  Or,
}

export enum BinaryOp {
  Plus,
  Minus,
  Times,
}

export enum UnaryOp {
  Plus,
  Minus
}

export type SourceLocation =  {
  start: {
    line: number,
    column: number
  },
  end: {
    line: number,
    column: number
  }
}

export interface Node {
  type: SyntaxType
  location: SourceLocation
}

export type NodeProp = {
  [index:string]: (Node | Array<Node>)
}

export type NodeFactory = (Location, NodeProp) => Node

export interface IfStatement extends Node {
  predicate: Node
  consequent: Array<Node>
  alternative: Array<Node>
}

export interface WhileStatement extends Node {
  predicate: Node
  statements: Array<Node>
}

export interface ForStatement extends Node {
  initialiser: Node
  predicate: Node
  finaliser: Node
  statements: Array<Node>
}

export interface VariableDefinition extends Node {
  variable: Node
  value: Node
}

export interface VariableAssignment extends Node {
  variable: Node
  value: Node
}

export interface PropertyAssignment extends Node {
  object: Node
  property: Node
  value: Node
}

export interface ArrayLiteral extends Node {
  elements: Array<Node>
}

export interface ObjectLiteral extends Node {
  pairs: Array<Node>
}

export interface TernaryOperation extends Node {
  predicate: Node,
  consequent: Node,
  alternative: Node
}

export interface BinaryOperation extends Node {
  op: BinaryOp,
  left: Node,
  right: Node
}

export interface BooleanOperation extends Node {
  op: BooleanOp,
  left: Node,
  right: Node
}

export interface UnaryOperation extends Node {
  op: UnaryOp,
  right: Node
}

function mkNode(type: SyntaxType, location: SourceLocation): Node {
  return { type, location }
}

export function createMkOfType(type: SyntaxType): NodeFactory {
  return (startToken: any, endToken?: any, props?: any) => {
    const location = {
      start: {
        line: startToken.first_line,
        column: startToken.first_column
      },
      end: {
        line: startToken.end_line,
        column: startToken.end_column
      }
    }
    if (endToken) {
      location.end.line = endToken.last_line
      location.end.column = endToken.last_column
    }
    return assign(mkNode(type, location), props || {})
  }
}
