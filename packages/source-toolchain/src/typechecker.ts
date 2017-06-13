import * as invariant from 'invariant'
import * as es from 'estree'
import { CFG } from './types/static'
import { generate } from 'escodegen'
import { stripIndent } from 'common-tags'

class TypeError {
  constructor(public node: es.Node, public explanation: string) {}
}

// Predefine simple type as constants
const numberT: CFG.Type = {name: 'number'}
const stringT: CFG.Type = {name: 'string'}

// Helper functions
const isSameFunctionType = (t1: CFG.Type, t2: CFG.Type) => {
  if (t1.params && t1.params.length != (t2.params && t2.params.length)) {
    return false
  }
  for (let i = 0; i < t1.params!.length; i++) {
    if (!isSameType(t1.params![i], t1.params![i])) {
      return false
    }
  }
  return true
}
const isFunction = (t: CFG.Type): boolean => t.hasOwnProperty('params')

export const isSameType = (t1: CFG.Type, t2: CFG.Type): boolean => (
  t1 === t2 || isSameFunctionType(t1, t2)
)

type Checker<T extends es.Node> = (node: T) => ({ type: CFG.Type, proof: es.Node })