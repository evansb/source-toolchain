/// <reference path='../typings/globals/estree/index.d.ts' />
declare module estraverse {
  export const version: string;

  export function traverse(root: ESTree.Node, visitor: Visitor): any
  export function replace(root: ESTree.Node, visitor: Visitor): any

  type F1 = (node: ESTree.Node) => any
  export interface Visitor { 
    fallback?: (string | F1)
    enter?(node: ESTree.Node, parent?: ESTree.Node): any
    leave?(node: ESTree.Node, parent?: ESTree.Node): any
  }

  export const VisitorOption: {
    Break: string
    Skip: string
    Remove: string
  }
}

declare module 'estraverse' {
  export = estraverse;
}
