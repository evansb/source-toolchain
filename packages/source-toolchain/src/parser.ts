/// <reference path='parser.d.ts' />
import * as es from 'estree'
import {
  parse as acornParse,
  Options as AcornOptions,
  SourceLocation,
  Position,
} from 'acorn'
import { simple } from 'acorn/dist/walk'
import { StudentError, ErrorType } from './errorTypes'
import syntaxTypes from './syntaxTypes'

export type ParserOptions = {
  week: number,
}

export type CFGScope = {
  name: string,
  parent?: CFGScope,
  root?: CFGVertex,
  env: {
    [name: string]: CFGSymbol,
  },
}

export type CFGType = {
  name: 'number' | 'string' | 'boolean' | 'function',
  params?: CFGType[],
}

export type CFGSymbol = {
  name: string,
  definedAt?: es.SourceLocation,
  type?: CFGType,
}

export type CFGVertex = {
  node: es.Node,
  scope?: CFGScope,
  edges: CFGEdge[]
  usages: CFGSymbol[],
}

export type CFGEdge = {
  type: 'next' | 'alternate' | 'consequent',
  node: CFGVertex,
}

export type Comment = {
  type: 'Line' | 'Block',
  value: string,
  start: number,
  end: number,
  loc: SourceLocation | undefined,
}

export type ParserState = {
  week: number
  node?: es.Program,
  errors: StudentError[],
  comments: Comment[],
  cfg: {
    nodes: { [id: string]: CFGVertex }
    scopes: CFGScope[],
    scopeStack: CFGScope[],
    lastNode?: es.Node,
  },
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

const createSyntaxCheckerWalker = () => {
  const walkers: {[name: string]: (node: es.Node, state: ParserState) => void } = {}

  for (const type of Object.keys(syntaxTypes)) {
    walkers[type] = (node: es.Node, state: ParserState) => {
      const id = freshId()
      Object.defineProperty(node, '__id', {
        enumerable: true,
        configurable: false,
        writable: false,
        value: id,
      })
      state.cfg.nodes[id] = {
        node,
        edges: [],
        usages: [],
      }
      if (syntaxTypes[node.type] > state.week) {
        state.errors.push({
          type: ErrorType.MatchFailure,
          node,
        })
      }
    }
  }

  // If Statement must
  // 1. Have Else case (week <= 3)
  // 2. If and Els case must be Surrounded by braces
  walkers.IfStatement = compose(
    walkers.IfStatement,
    (node: es.IfStatement, state: ParserState) => {
      if (node.consequent! && node.consequent.type !== 'BlockStatement') {
        state.errors.push({
          type: ErrorType.IfConsequentNotABlockStatement,
          node,
        })
      }
      if (state.week <= 3 && !node.alternate) {
        state.errors.push({
          type: ErrorType.MissingIfAlternate,
          node,
        })
      } else if (node.alternate && node.alternate.type !== 'BlockStatement') {
        state.errors.push({
          type: ErrorType.IfAlternateNotABlockStatement,
          node,
        })
      }
    },
  )

  // Binary Expressions
  // == and != are banned, must use !== and ===
  walkers.BinaryExpression = compose(
    walkers.BinaryExpression,
    (node: es.BinaryExpression, state: ParserState) => {
      if (node.operator === '==') {
        state.errors.push({
          type: ErrorType.UseStrictEquality,
          node,
        })
      } else if (node.operator === '!=') {
        state.errors.push({
          type: ErrorType.UseStrictInequality,
          node,
        })
      }
    },
  )

  // Variable Declarations
  // Can only have single declarations
  walkers.VariableDeclaration = compose(
    walkers.VariableDeclaration,
    (node: es.VariableDeclaration, state: ParserState) => {
      if (node.declarations.length > 1) {
        state.errors.push({
          type: ErrorType.MultipleDeclarations,
          node,
        })
      }
    },
  )

  return walkers
}

const createAcornParserOptions = (state: ParserState): AcornOptions => ({
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
    state.errors.push({
      type: ErrorType.MissingSemicolon,
      node,
    })
  },

  onTrailingComma(end: any, loc: Position) {
    const node = ({
      type: 'Statement',
      loc: {
        end: {line: loc.line, column: loc.column + 1},
        start: loc,
      },
    }) as any
    state.errors.push({
      type: ErrorType.TrailingComma,
      node,
    })
  },

  onComment: state.comments,
})

export const createParser = ({ week }: ParserOptions): ParserState => {
  const globalScope = {
    name: '*global*',
    env: {},
  }
  return {
    week,
    errors: [],
    comments: [],
    cfg: {
      nodes: {},
      scopes: [globalScope],
      scopeStack: [globalScope],
    },
  }
}

export const parse = (source: string, state: ParserState | number) => {
  if (typeof state === 'number') {
    state = createParser({ week: state })
  }
  try {
    const program = acornParse(source, createAcornParserOptions(state))
    state.node = program
    simple(program, createSyntaxCheckerWalker(), undefined, state)
  } catch (error) {
    if (error instanceof SyntaxError) {
      const loc = (error as any).loc
      state.errors.push({
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
