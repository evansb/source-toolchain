/// <reference path='parser.d.ts' />
import * as es from 'estree'
import {
  parse as acornParse,
  Options as AcornOptions,
  SourceLocation,
  Position,
} from 'acorn'
import { simple } from 'acorn/dist/walk'
import { ErrorType } from './types/error'
import { StaticState } from './types/static'
import syntaxTypes from './syntaxTypes'
import { createContext } from './context'

export type ParserOptions = {
  week: number,
}

export const freshId = (() => {
  let id = 0
  return () => {
    id++
    return 'node_' + id
  }
})()

function compose<T extends es.Node, S>(
  w1: (node: T, state: S) => void,
  w2: (node: T, state: S) => void) {
  return (node: T, state: S) => {
    w1(node, state)
    w2(node, state)
  }
}

const walkers: {[name: string]: (node: es.Node, state: StaticState) => void } = {}

for (const type of Object.keys(syntaxTypes)) {
  walkers[type] = (node: es.Node, state: StaticState) => {
    const id = freshId()
    Object.defineProperty(node, '__id', {
      enumerable: true,
      configurable: false,
      writable: false,
      value: id,
    })
    state.cfg.nodes[id] = {
      node,
      scope: undefined,
      edges: [],
      usages: [],
    }
    if (syntaxTypes[node.type] > state.week) {
      state.parser.errors.push({
        kind: 'syntax',
        type: ErrorType.MatchFailure,
        node,
      })
    }
  }
}

// If Statement must
// 1. Have Else case (week <= 3)
// 2. If and Els case must be Surrounded by braces
const checkIfStatement = (node: es.IfStatement, state: StaticState) => {
  if (node.consequent! && node.consequent.type !== 'BlockStatement') {
    state.parser.errors.push({
      kind: 'syntax',
      type: ErrorType.IfConsequentNotABlockStatement,
      node,
    })
  }
  if (state.week <= 3 && !node.alternate) {
    state.parser.errors.push({
      kind: 'syntax',
      type: ErrorType.MissingIfAlternate,
      node,
    })
  } else if (node.alternate && node.alternate.type !== 'BlockStatement') {
    state.parser.errors.push({
      kind: 'syntax',
      type: ErrorType.IfAlternateNotABlockStatement,
      node,
    })
  }
}
walkers.IfStatement = compose(walkers.IfStatement, checkIfStatement)

// Binary Expressions
// == and != are banned, must use !== and ===
const checkBinaryExpression = (node: es.BinaryExpression, state: StaticState) => {
  if (node.operator === '==') {
    state.parser.errors.push({
      kind: 'syntax',
      type: ErrorType.UseStrictEquality,
      node,
    })
  } else if (node.operator === '!=') {
    state.parser.errors.push({
      kind: 'syntax',
      type: ErrorType.UseStrictInequality,
      node,
    })
  }
}
walkers.BinaryExpression = compose(walkers.BinaryExpression, checkBinaryExpression)

// Variable Declarations
// Can only have single declarations
const checkVariableDeclaration = (node: es.VariableDeclaration, state: StaticState) => {
  if (node.declarations.length > 1) {
    state.parser.errors.push({
      kind: 'syntax',
      type: ErrorType.MultipleDeclarations,
      node,
    })
  } else if (node.declarations.length == 1 && !node.declarations[0].init) {
    state.parser.errors.push({
      kind: 'syntax',
      type: ErrorType.NoDeclarations,
      node,
    })
  }
}
walkers.VariableDeclaration = compose(walkers.VariableDeclaration, checkVariableDeclaration)

const createAcornParserOptions = (state: StaticState): AcornOptions => ({
  sourceType: 'script',
  ecmaVersion: 5,
  locations: true,
  onInsertedSemicolon(end: any, loc: any) {
    const node = ({
      type: 'Statement',
      loc: {
        end: {line: loc.line, column: loc.column + 1},
        start: loc,
      },
    }) as any
    state.parser.errors.push({
      kind: 'syntax',
      type: ErrorType.MissingSemicolon,
      node,
    })
  },
  onTrailingComma(end: any, loc: Position) {
    const node = ({
      type: 'Statement',
      loc: {
        end: { line: loc.line, column: loc.column + 1 },
        start: loc,
      },
    }) as any
    state.parser.errors.push({
      kind: 'syntax',
      type: ErrorType.TrailingComma,
      node,
    })
  },
  onComment: state.parser.comments,
})

export const parse = (source: string, state: StaticState | number) => {
  if (typeof state === 'number') {
    state = createContext({ week: state })
  }
  try {
    const program = acornParse(source, createAcornParserOptions(state))
    state.parser.program = program
    simple(program, walkers, undefined, state)
  } catch (error) {
    if (error instanceof SyntaxError) {
      const loc = (error as any).loc
      state.parser.errors.push({
        kind: 'syntax',
        type: ErrorType.AcornParseError,
        explanation: error.toString(),
        node: ({
          type: 'Statement',
          loc: {
            start: { line: loc.line, column: loc.column },
            end: { line: loc.line, column: loc.column + 1 },
          },
        }) as any,
      })
    } else {
      throw error
    }
  }
  return state
}
