import * as invariant from 'invariant'
import * as es from 'estree'
import { base } from 'acorn/dist/walk'
import { ErrorType } from './errorTypes'
import { ParserState, CFGScope } from './parser'

type HasID = {__id: string, __param?: boolean, __declaration?: boolean}

const freshId = (() => {
  let id = 0
  return () => {
    id++
    return 'lambda_' + id
  }
})()

/**
 * Connect previously visited node stored in parser state to currently visited
 * node
 * @param state the parser state
 * @param nextNode currently visited node
 */
function connectPrevious(state: ParserState, nextNode: es.Node & HasID): void {
  const parent = state.cfg.lastNode as (es.Node & HasID)
  if (!parent) {
    return
  }
  const vertex = state.cfg.nodes[parent.__id]
  if (parent.type === 'IfStatement') {
    const consequent = parent.consequent as es.BlockStatement
    const alternate = parent.alternate as es.BlockStatement
    if (consequent.body[0] === nextNode) {
      vertex.edges.push({
        type: 'consequent',
        node: nextNode.__id,
      })
      return
    } else if (alternate.body[0] === nextNode) {
      vertex.edges.push({
        type: 'alternate',
        node: nextNode.__id,
      })
      return
    }
  }
  vertex.edges.push({
    type: 'next',
    node: nextNode.__id,
  })
}

const currentScope = (state: ParserState) => (
  state.cfg.scopeStack[state.cfg.scopeStack.length - 1]
)

const getSymbol = (state: ParserState, name: string) => {
  let scope: CFGScope | undefined = currentScope(state)
  while (scope) {
    if (scope.env.hasOwnProperty(name)) {
      return scope.env[name]
    } else {
      scope = scope.parent
    }
  }
  return undefined
}

const defineVariable = (state: ParserState, identifier: es.Identifier) => {
  const scope = currentScope(state)
  if (scope.env.hasOwnProperty(identifier.name)) {
    state.errors.push({
      type: ErrorType.VariableRedeclaration,
      node: identifier,
    })
  } else {
    (identifier as any).__declaration = true
    scope.env[identifier.name] = {
      name: identifier.name,
      definedAt: identifier.loc!,
    }
  }
}

const walk = (node: es.Node, visitors: any, state: ParserState) => {
  const go = (n: es.Node, st: ParserState, override?: string ) => {
    const type = override || n.type
    const found = visitors[type]
    if (found) {
      found(n, st)
    }
    base[type](n, st, go)
    const found2 = visitors[type + 'After']
    if (found2) {
      found2(n, st)
    }
  }
  go(node, state, undefined)
}

type QueueElement = {
  scope: CFGScope,
  node: es.Node,
}

/**
 * Construct Control Flow Graph from given initial parser state.
 * @param initialState initial successful parser state
 */
export const generateCFG = (initialState: ParserState) => {
  invariant(initialState.node!, 'Must call parse() and successfully' +
    'generate AST before calling generateCFG()')
  const globalScope = currentScope(initialState)
  const queue: QueueElement[] = []

  let skipCount = 0

  const walker = {
    FunctionExpression(node: es.FunctionExpression & HasID, state: ParserState) {
      if (skipCount) { return }
      return walker.FunctionDeclaration(node as any, state)
    },
    FunctionDeclaration(node: es.FunctionDeclaration & HasID, state: ParserState) {
      if (node.id && node !== queue[0].node) {
        defineVariable(state, node.id)
      }
      if (skipCount) { return }
      if (node !== queue[0].node) {
        queue.push({ node, scope: currentScope(state)})
        skipCount++
        return
      }
      const scope: CFGScope = {
        parent: currentScope(state),
        name: node.id ? node.id.name : freshId(),
        env: {},
      }
      node.params.forEach(n => {
        (n as any).__param = true
        const identifier = n as es.Identifier
        scope.env[identifier.name] = {
          name: identifier.name,
          definedAt: identifier.loc!,
        }
      })
      state.cfg.scopeStack.push(scope)
      state.cfg.scopes.push(scope)
      delete state.cfg.lastNode
    },
    FunctionDeclarationAfter(node: es.FunctionDeclaration & HasID, state: ParserState) {
      skipCount = Math.max(0, skipCount - 1)
      if (node === queue[0].node) {
        state.cfg.scopeStack.pop()
      }
      state.cfg.lastNode = node
    },
    ExpressionStatement(node: es.ExpressionStatement & HasID, state: ParserState) {
      if (skipCount) { return }
      connectPrevious(state, node)
      state.cfg.lastNode = node
    },
    VariableDeclaration(node: es.VariableDeclaration & HasID, state: ParserState) {
      if (skipCount) { return }
      connectPrevious(state, node)
      const declaration = node.declarations[0]
      const identifier = declaration.id as es.Identifier
      defineVariable(state, identifier)
      state.cfg.lastNode = node
    },
    IfStatement(node: es.IfStatement & HasID, state: ParserState) {
      if (skipCount) { return }
      connectPrevious(state, node)
      state.cfg.lastNode = node
    },
    ReturnStatement(node: es.ReturnStatement & HasID, state: ParserState) {
      connectPrevious(state, node)
      state.cfg.lastNode = node
    },
    Identifier(node: es.Identifier & HasID, state: ParserState) {
      if (skipCount) { return }
      // Skip if node is parameter or declaration
      if (node.__param || node.__declaration) {
        return
      }
      // Else, add usage, add to error if undefined in symbol table
      const vertex = state.cfg.nodes[(state.cfg.lastNode as any).__id]
      const symbol = getSymbol(state, node.name)
      if (symbol) {
        vertex.usages.push(symbol)
      } else {
        state.errors.push({
          type: ErrorType.UndefinedVariable,
          node,
        })
      }
    },
  }

  queue.push({ node: initialState.node!, scope: currentScope(initialState) })

  while (queue.length > 0) {
    const { node, scope } = queue[0]
    initialState.cfg.scopeStack.push(scope)
    walk(node, walker, initialState)
    queue.shift()
  }

  initialState.cfg.scopeStack = [globalScope]
}
