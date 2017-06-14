import * as invariant from 'invariant'
import * as es from 'estree'
import { base } from 'acorn/dist/walk'
import { ErrorType } from './types/error'
import { StaticState, CFG, anyT } from './types/static'

type HasID = {__id: string, __param?: boolean, __declaration?: boolean}

const freshId = (() => {
  let id = 0
  return () => {
    id++
    return 'lambda_' + id
  }
})()

function assignScope(state: StaticState, node: es.Node & HasID) {
  state.cfg.nodes[node.__id].scope = currentScope(state)
}

/**
 * Connect previously visited node stored in parser state to currently visited
 * node
 * @param state the parser state
 * @param nextNode currently visited node
 */
function connectPrevious(state: StaticState, nextNode: es.Node & HasID): void {
  const parent = state.cfg._last as (es.Node & HasID)
  if (!parent) {
    const scope = currentScope(state)
    scope.root = state.cfg.nodes[nextNode.__id]
    return
  }
  const vertex = state.cfg.nodes[parent.__id]
  if (parent.type === 'IfStatement') {
    const consequent = parent.consequent as es.BlockStatement
    const alternate = parent.alternate as es.BlockStatement
    if (consequent.body[0] === nextNode) {
      vertex.edges.push({
        type: 'consequent',
        to: state.cfg.nodes[nextNode.__id],
      })
      return
    } else if (alternate.body[0] === nextNode) {
      vertex.edges.push({
        type: 'alternate',
        to: state.cfg.nodes[nextNode.__id],
      })
      return
    }
  }
  vertex.edges.push({
    type: 'next',
    to: state.cfg.nodes[nextNode.__id],
  })
}

export const currentScope = (state: StaticState) => (
  state.cfg._scopes[state.cfg._scopes.length - 1]
)

const getSymbol = (state: StaticState, name: string) => {
  let scope = currentScope(state)
  while (scope) {
    if (scope.env.hasOwnProperty(name)) {
      return scope.env[name]
    } else {
      scope = scope.parent!
    }
  }
  return undefined
}

const defineVariable = (state: StaticState, identifier: es.Identifier) => {
  const scope = currentScope(state)
  if (scope.env.hasOwnProperty(identifier.name)) {
    state.cfg.errors.push({
      kind: 'syntax',
      type: ErrorType.VariableRedeclaration,
      node: identifier,
    })
  } else {
    (identifier as any).__declaration = true
    scope.env[identifier.name] = {
      name: identifier.name,
      type: anyT,
      proof: identifier,
      definedAt: identifier.loc!,
    }
  }
}

const walk = (node: es.Node, visitors: any, state: StaticState) => {
  const go = (n: es.Node, st: StaticState, override?: string) => {
    const type = override || n.type
    const found = visitors[type]
    if (found) {
      found(n, st)
    }
    base[type](n, st, go)
    const found2 = visitors['$' + type]
    if (found2) {
      found2(n, st)
    }
  }
  go(node, state, undefined)
}

type QueueElement = {
  scope: CFG.Scope,
  node: es.Node,
}

type Walker<T extends es.Node> = (node: T & HasID, state: StaticState) => void

const walkers: {[name: string]: Walker<any>} = {}

const ignore = (node: es.Node & HasID, state: StaticState) => {
  if (state.cfg._skip) { return }
  connectPrevious(state, node)
  state.cfg._last = node
}

walkers.ReturnStatement = walkers.ExpressionStatement = walkers.IfStatement = ignore

walkers.IfStatement = (node: es.IfStatement & HasID, state: StaticState) => {
  connectPrevious(state, node.test as es.Node & HasID)
  state.cfg._last = node.test
}

walkers.FunctionExpression = walkers.FunctionDeclaration = (node: es.FunctionDeclaration & HasID, state: StaticState) => {
  const { _queue, _skip } = state.cfg
  if (node.id && node !== _queue![0].node) {
    defineVariable(state, node.id)
  }
  if (_skip) { return }
  connectPrevious(state, node)
  if (node !== _queue![0].node) {
    _queue!.push({ node, scope: currentScope(state)})
    state.cfg._skip = state.cfg._skip! + 1
    return
  }
  const scope: CFG.Scope = {
    parent: currentScope(state),
    node,
    type: anyT,
    proof: node,
    name: node.id ? node.id.name : freshId(),
    env: {},
  }
  node.params.forEach(n => {
    (n as any).__param = true
    const identifier = n as es.Identifier
    scope.env[identifier.name] = {
      name: identifier.name,
      type: anyT,
      proof: identifier,
      definedAt: identifier.loc!,
    }
  })
  state.cfg._scopes.push(scope)
  state.cfg.scopes.push(scope)
  delete state.cfg._last
}

walkers.$FunctionExpression = walkers.$FunctionDeclaration = (node: es.FunctionDeclaration & HasID, state: StaticState) => {
  state.cfg._skip = Math.max(0, state.cfg._skip! - 1)
  if (node === state.cfg._queue![0].node) {
    state.cfg._scopes.pop()
  }
  state.cfg._last = node
}

walkers.VariableDeclaration = (node: es.VariableDeclaration & HasID, state: StaticState) => {
  if (state.cfg._skip) { return }
  connectPrevious(state, node)
  const declaration = node.declarations[0]
  const identifier = declaration.id as es.Identifier
  defineVariable(state, identifier)
  state.cfg._last = node
}

walkers.Identifier = (node: es.Identifier & HasID, state: StaticState) => {
  if (state.cfg._skip) { return }
  // Skip if node is parameter or declaration
  if (node.__param || node.__declaration) {
    return
  }
  // Else, add usage, add to error if undefined in symbol table
  const vertex = state.cfg.nodes[(state.cfg._last as any).__id]
  const symbol = getSymbol(state, node.name)
  if (symbol) {
    vertex.usages.push(symbol)
  } else {
    state.cfg.errors.push({
      kind: 'syntax',
      type: ErrorType.UndefinedVariable,
      node,
    })
  }
}

/**
 * Construct Control Flow Graph from given initial parser state.
 * @param initialState initial successful parser state
 */
export const generateCFG = (context: StaticState) => {
  const { parser } = context
  invariant(parser && parser.program!, 'Must call parse() and successfully' +
    'generate AST before calling generateCFG()')
  const globalScope = currentScope(context)
  context.cfg._queue = []
  context.cfg._skip = 0
  context.cfg._queue.push({ node: parser.program!, scope: globalScope })
  while (context.cfg._queue.length > 0) {
    const { node, scope } = context.cfg._queue[0]
    context.cfg._scopes.push(scope)
    walk(node, walkers, context)
    context.cfg._queue.shift()
  }
  context.cfg._scopes = [globalScope]
}
