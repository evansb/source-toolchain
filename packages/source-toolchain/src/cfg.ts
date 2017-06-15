import * as invariant from 'invariant'
import * as es from 'estree'
import { recursive, Walkers, Walker, base } from 'acorn/dist/walk'

import { ErrorType } from './types/error'
import { StaticState, CFG, anyT, HasID } from './types/static'
import { compose } from './astUtils'

const freshLambda = (() => {
  let id = 0
  return () => {
    id++
    return 'lambda_' + id
  }
})()

const walkers: Walkers<any> = {}

let nodeStack: Array<es.Node & HasID> = []
let scopeQueue: CFG.Scope[] = []
let edgeLabel: CFG.EdgeLabel = 'next'

const currentScope = () => scopeQueue[0]!

const connect = (node: es.Node & HasID, state: StaticState) => {
  // Empty node stack, connect all of them with node
  let lastNode = nodeStack.pop()
  const vertex = state.cfg.nodes[node.__id]

  // If there is no last node, this is the first node in the scope.
  if (!lastNode) {
    currentScope().entry = vertex
  }
  while (lastNode) {
    // Connect previously visited node with this node
    state.cfg.edges[lastNode.__id].push({
      type: edgeLabel,
      to: vertex
    })
    lastNode = nodeStack.pop()
  }
  // Reset edge label
  edgeLabel = 'next'
  nodeStack.push(node)
}

const exitScope = (state: StaticState) => {
  while (nodeStack.length > 0) {
    let node = nodeStack.shift()!
    const vertex = state.cfg.nodes[node.__id]
    currentScope().exits.push(vertex)
  }
}

walkers.ExpressionStatement = compose(connect, base.ExpressionStatement)
walkers.VariableDeclaration = compose(connect, base.VariableDeclaration)

const walkIfStatement: Walker<es.IfStatement, StaticState> = (
  node,
  state,
  recurse
) => {
  const lastNode = nodeStack.pop()
  const test = (node.test as any) as es.Node & HasID
  let consequentExit, alternateExit
  // Connect test with previous node
  connect(test, state)

  // Process the consequent branch
  edgeLabel = 'consequent'
  recurse(node.consequent, state)
  // Remember exits from consequent
  consequentExit = nodeStack
  // Process the alternate branch
  if (node.alternate) {
    const alternate = (node.alternate as any) as es.Node & HasID
    edgeLabel = 'alternate'
    nodeStack = [test]
    recurse(alternate, state)
    alternateExit = nodeStack
  }
  // Restore node Stack to consequent exits
  nodeStack = consequentExit
  // Add alternate exits if any
  if (alternateExit) {
    nodeStack = nodeStack.concat(alternateExit)
  }
}
walkers.IfStatement = walkIfStatement

const walkReturnStatement: Walker<es.ReturnStatement, StaticState> = (
  node,
  state
) => {
  connect(node, state)
  exitScope(state)
}
walkers.ReturnStatement = compose(base.ReturnStatement, walkReturnStatement)

const walkFunction: Walker<
  es.FunctionDeclaration | es.FunctionExpression,
  StaticState
> = (node, state, recurse) => {
  // Check whether function declaration is from outer scope or its own
  if (scopeQueue[0].node !== node) {
    connect(node, state)
    const name = node.id ? node.id.name : freshLambda()
    const scope: CFG.Scope = {
      name,
      type: anyT,
      node,
      parent: currentScope(),
      exits: [],
      env: {}
    }
    scopeQueue.push(scope!)
    state.cfg.scopes.push(scope)
  } else {
    node.body.body.forEach(child => {
      recurse(child, state)
    })
    exitScope(state)
  }
}
walkers.FunctionDeclaration = walkers.FunctionExpression = walkFunction

const walkProgram: Walker<es.Program, StaticState> = (node, state, recurse) => {
  exitScope(state)
}
walkers.Program = compose(base.Program, walkProgram)

export const generateCFG = (state: StaticState) => {
  invariant(
    state.cfg.scopes.length === 1,
    `state.cfg.scopes must contain
  exactly the global scope before generating CFG`
  )
  invariant(
    state.cfg.scopes[0].node,
    `state.cfg.scopes[0] node 
  must be a program from the parser`
  )
  // Reset states
  nodeStack = []
  scopeQueue = [state.cfg.scopes[0]]
  edgeLabel = 'next'

  // Process Node BFS style
  while (scopeQueue.length > 0) {
    const current = scopeQueue[0].node!
    recursive(current, state, walkers)
    scopeQueue.shift()
  }
}
