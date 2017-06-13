import * as es from 'estree'
import { SourceLocation } from 'acorn'
import { ErrorType } from './error'

export namespace CFG {
  export type Scope = {
    name: string,
    parent?: Scope,
    root?: Vertex,
    env: {
      [name: string]: Sym,
    },
  }

  export type Vertex = {
    node: es.Node,
    scope?: Scope,
    edges: Edge[],
    usages: Sym[],
  }

  export type Sym = {
    name: string,
    definedAt?: es.SourceLocation,
    type?: Type,
  }

  export type Type = {
    name: 'number' | 'string' | 'boolean' | 'function' | 'never',
    params?: Type[],
  }

  export type Edge = {
    type: 'next' | 'alternate' | 'consequent',
    to: Vertex,
  }
}

export type Comment = {
  type: 'Line' | 'Block',
  value: string,
  start: number,
  end: number,
  loc: SourceLocation | undefined,
}

export type TypeError = {
  kind: 'type',
  type: ErrorType,
  expected: CFG.Type[],
  got: CFG.Type,
  node: es.Node,
  explanation?: string,
}

export type SyntaxError = {
  kind: 'syntax',
  type: ErrorType,
  node: es.Node,
  explanation?: string,
}

export type StaticState = {
  week: number,
  parser: {
    program?: es.Program,
    errors: SyntaxError[],
    comments: Comment[],
  },
  cfg: {
    nodes: { [id: string]: CFG.Vertex }
    scopes: CFG.Scope[],
    scopeStack: CFG.Scope[],
    errors: Array<SyntaxError|TypeError>,
    _last?: es.Node,
    _skip?: number,
    _queue?: Array<{node: es.Node, scope: CFG.Scope}>,
  },
}
