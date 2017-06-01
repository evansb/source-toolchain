import {
  tokenizer,
  Token,
  parse as acornParse,
  Options as AcornOptions,
  SourceLocation,
} from 'acorn'
import * as es from 'estree'
import { SUntyped } from './types'
import { Visitors, noop, visitProgram } from './visitors'
import { StudentError, ErrorCategory, ErrorType } from './types'

type WeekTypes = {
  week: number,
  types: string[],
}

export type SymbolTable = {
  [name: string]: SUntyped,
}

export type Comment = {
  type: 'Line' | 'Block',
  value: string,
  start: number,
  end: number,
  loc: SourceLocation | undefined,
}

export type ParserState = {
  stopped: boolean,
  node: es.Node | undefined,
  errors: StudentError[],
  frames: SymbolTable[],
  comments: Comment[],
  environments: {
    [name: string]: SymbolTable,
  },
}

const week3Types = [
  'Program',
  // Statements
  'ExpressionStatement',
  'IfStatement',
  'FunctionDeclaration',
  'VariableDeclaration',
  'ReturnStatement',
  // Expressions
  'CallExpression',
  'UnaryExpression',
  'BinaryExpression',
  'LogicalExpression',
  'ConditionalExpression',
  'FunctionExpression',
  'Identifier',
  'Literal',
]

let counter = 0

export const freshId = () => {
  counter++
  return `__node${counter}`
}

const weekTypes: WeekTypes[] = [
  {
    week: 3,
    types: week3Types,
  },
]

const defineVariable = (identifier: es.Identifier, state: ParserState) => {
  if (state.frames[0]![identifier.name]) {
    state.errors.push({
      type: ErrorType.VariableRedeclaration,
      node: identifier,
    })
  } else {
    state.frames[0]![identifier.name] = {
      name: identifier.name,
      loc: identifier.loc!,
    }
    state.frames[0]![identifier.name] = {
      name: identifier.name,
      loc: identifier.loc!,
    }
  }
}

const isVariableDefinedInCurrentFrame = (name: string, state: ParserState) => {
  for (const frame of state.frames) {
    if (frame.hasOwnProperty(name)) {
      return true
    }
  }
  return false
}

const createVisitors = (week: number, state: ParserState) => {
  const visitors: Partial<Visitors<void>> = {
    onError(error: ErrorType, parent: es.Node, node: es.Node | null | undefined) {
      state.errors.push({
        type: error,
        node: node!,
      })
    },
  }

  // Checking for allowed syntax types
  const allowedTypes = getAllowedSyntaxTypes(week)

  for (const type of week3Types) {
    (visitors as any)[type] = {
      before: (parent: es.Node | undefined, node: es.Node) => {
        state.node = node;
        (node as any).__id = freshId()

        if (!allowedTypes[node.type]) {
          state.errors.push()
          state.stopped = true
        }
      },
      after: noop,
    }
  }

  const iBefore = visitors.IfStatement!.before

  // Augment If and Else visitors
  visitors.IfStatement!.before = (parent: es.Node, node: es.IfStatement) => {
    iBefore(parent, node)
    if (!node.consequent) {
      state.errors.push({
        type: ErrorType.MissingIfConsequent,
        node,
      })
    } else if (node.consequent && node.consequent.type !== 'BlockStatement') {
      state.errors.push({
        type: ErrorType.IfConsequentNotABlockStatement,
        node,
      })
    }

    if (!node.alternate) {
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
  }

  // Collect Symbols in the symbol table
  const pVAfter = visitors.VariableDeclaration!.after
  const pFAfter = visitors.FunctionDeclaration!.after

  visitors.VariableDeclaration!.after = (parent: es.Node, node: es.VariableDeclaration) => {
    const identifier = node.declarations[0]!.id as es.Identifier
    defineVariable(identifier, state)
    pVAfter(parent, node)
  }

  visitors.FunctionDeclaration!.after = (parent: es.Node, node: es.FunctionDeclaration) => {
    defineVariable(node.id, state)
    pFAfter(parent, node)
  }

  const pBefore = visitors.FunctionDeclaration!.before
  const pAfter = visitors.FunctionDeclaration!.after

  visitors.FunctionDeclaration!.before = (parent: es.Node, node: es.FunctionDeclaration) => {
    pBefore(parent, node)
    defineVariable(node.id, state)
    const frame: SymbolTable = {}
    state.environments[node.id.name] = frame
    state.frames.unshift(frame)
  }

  visitors.FunctionDeclaration!.after = (parent: es.Node, node: es.FunctionDeclaration) => {
    pAfter(parent, node)
    state.frames.shift()
  }

  // Identifier must exist when referenced
  const iAfter = visitors.Identifier!.after

  visitors.Identifier!.after = (parent: es.Node, node: es.Identifier) => {
    iAfter(parent, node)
    if (!isVariableDefinedInCurrentFrame(node.name, state)) {
      state.errors.push({
        type: ErrorType.UndefinedVariable,
        node,
      })
    }
  }

  visitors.Program!.after = (parent: es.Node, node: es.Program) => {
    state.stopped = true
  }

  return (visitors as Visitors<void>)
}

const getAllowedSyntaxTypes = (week: number) => {
  const types: {[type: string]: boolean} = {}

  for (const wt of weekTypes) {
    for (const type of wt.types) {
      types[type] = wt.week <= week
    }
  }

  return types
}

const createParserOptions = (filename: string, state: ParserState): AcornOptions => ({
  sourceType: 'script',
  ecmaVersion: 5,
  locations: true,
  onInsertedSemicolon() {
    state.errors.push({
      type: ErrorType.MissingSemicolon,
      node: state.node!,
    })
  },
  onTrailingComma() {
    state.errors.push({
      type: ErrorType.TrailingComma,
      node: state.node!,
    })
  },
  onComment: state.comments,
})

export const parse = (source: string, week: number, filename = 'unknown') => {
  const initialFrame: SymbolTable = {
  }

  const state: ParserState = {
    node: undefined,
    stopped: false,
    errors: [],
    comments: [],
    frames: [initialFrame],
    environments: {
      '*': initialFrame,
    },
  }

  try {
    const program = acornParse(source, createParserOptions(filename, state))
    const visitors = createVisitors(week, state)
    const generator = visitProgram(program, visitors)
    while (!state.stopped) {
      generator.next()
    }
    state.node = program
  } catch (error) {
    if (error.toString().match(/SyntaxError/)) {
      state.errors.push({
        type: ErrorType.AcornParseError,
        explanation: error.toString(),
        node: state.node!,
      })
    } else {
      throw error
    }
  }
  return state
}
