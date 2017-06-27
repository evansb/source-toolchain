/// <reference path='parser.d.ts' />
import * as es from 'estree'
import {
  parse as acornParse,
  Options as AcornOptions,
  SourceLocation,
  Position
} from 'acorn'
import { stripIndent } from 'common-tags'
import { simple } from 'acorn/dist/walk'

import { IError } from './types/error'
import { StaticState } from './types/static'
import syntaxTypes from './syntaxTypes'
import { createContext } from './context'
import rules from './rules'

export type ParserOptions = {
  week: number
}

export class DisallowedConstructError implements IError {
  nodeType: string

  constructor(public node: es.Node) {
    this.nodeType = this.splitNodeType()
  }

  get location() {
    return this.node.loc!
  }

  explain() {
    return `${this.nodeType} is not allowed`
  }

  elaborate() {
    return stripIndent`
      You are trying to use ${this.nodeType}, which is not yet allowed (yet).
    `
  }

  private splitNodeType() {
    const nodeType = this.node.type
    const tokens: string[] = []
    let soFar = ''
    for (let i = 0; i < nodeType.length; i++) {
      const isUppercase = nodeType[i] === nodeType[i].toUpperCase()
      if (isUppercase && i > 0) {
        tokens.push(soFar)
        soFar = ''
      } else {
        soFar += nodeType[i]
      }
    }
    return tokens.join(' ')
  }
}

export class FatalSyntaxError implements IError {
  constructor(public location: es.SourceLocation, public message: string) {}

  explain() {
    return `Syntax Error: ${this.message}`
  }

  elaborate() {
    return 'There is a syntax error in your program'
  }
}

export class MissingSemicolonError implements IError {
  constructor(public location: es.SourceLocation) {}

  explain() {
    return 'Missing semicolon at the end of statement'
  }

  elaborate() {
    return 'Every statement must be terminated by a semicolon.'
  }
}

export class TrailingCommaError implements IError {
  constructor(public location: es.SourceLocation) {}

  explain() {
    return 'Trailing comma'
  }

  elaborate() {
    return 'Please remove the trailing comma'
  }
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
  w2: (node: T, state: S) => void
) {
  return (node: T, state: S) => {
    w1(node, state)
    w2(node, state)
  }
}

const walkers: {
  [name: string]: (node: es.Node, state: StaticState) => void
} = {}

for (const type of Object.keys(syntaxTypes)) {
  walkers[type] = (node: es.Node, state: StaticState) => {
    const id = freshId()
    Object.defineProperty(node, '__id', {
      enumerable: true,
      configurable: false,
      writable: false,
      value: id
    })
    state.cfg.nodes[id] = {
      id,
      node,
      scope: undefined,
      usages: []
    }
    state.cfg.edges[id] = []
    if (syntaxTypes[node.type] > state.week) {
      state.parser.errors.push(new DisallowedConstructError(node))
    }
  }
}

const createAcornParserOptions = (state: StaticState): AcornOptions => ({
  sourceType: 'script',
  ecmaVersion: 5,
  locations: true,
  onInsertedSemicolon(end: any, loc: any) {
    state.parser.errors.push(
      new MissingSemicolonError({
        end: { line: loc.line, column: loc.column + 1 },
        start: loc
      })
    )
  },
  onTrailingComma(end: any, loc: Position) {
    state.parser.errors.push(
      new TrailingCommaError({
        end: { line: loc.line, column: loc.column + 1 },
        start: loc
      })
    )
  },
  onComment: state.parser.comments
})

rules.forEach(rule => {
  const keys = Object.keys(rule.checkNodes)
  keys.forEach(key => {
    walkers[key] = compose(walkers[key], (node, state) => {
      const checker = rule.checkNodes[key]
      const errors = checker(node)
      if (errors.length > 0) {
        state.parser.errors = state.parser.errors.concat(errors)
      }
    })
  })
})

export const parse = (source: string, state: StaticState | number) => {
  if (typeof state === 'number') {
    state = createContext({ week: state })
  }
  try {
    const program = acornParse(source, createAcornParserOptions(state))
    state.parser.program = program
    state.cfg.scopes[0].node = program
    simple(program, walkers, undefined, state)
  } catch (error) {
    if (error instanceof SyntaxError) {
      const loc = (error as any).loc
      const location = {
        start: { line: loc.line, column: loc.column },
        end: { line: loc.line, column: loc.column + 1 }
      }
      const message = error.toString()
      state.parser.errors.push(new FatalSyntaxError(location, error.toString()))
    } else {
      throw error
    }
  }
  return state
}
