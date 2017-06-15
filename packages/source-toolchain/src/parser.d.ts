declare module 'acorn/dist/walk' {
  import * as es from 'estree'

  type SimpleVisitor<S> = (node: es.Node, state?: S) => void
  type SimpleVisitors<S> = { [name: string]: SimpleVisitor<S> }
  type NodeTest = (nodeType: string, node: es.Node) => boolean

  interface AcornWalk {
    base: any
    simple<S>(
      node: es.Node,
      visitors: SimpleVisitors<S>,
      base?: SimpleVisitors<S>,
      state?: S
    ): void
    findNodeAt<S>(
      node: es.Node,
      start: null | number,
      end: null | number,
      test: string | NodeTest,
      base?: SimpleVisitors<S>,
      state?: S
    ): void
    findNodeAround<S>(
      node: es.Node,
      pos: es.Position,
      test: string | NodeTest,
      base?: SimpleVisitors<S>,
      state?: S
    ): void
    findNodeAfter<S>(
      node: es.Node,
      pos: es.Position,
      test: string | NodeTest,
      base?: SimpleVisitors<S>,
      state?: S
    ): void
  }

  const AcornWalkStatic: AcornWalk
  export = AcornWalkStatic
}
