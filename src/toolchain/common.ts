import { Observable } from 'rxjs/Observable'

const NeverSym = Symbol()
const UndefinedSym = Symbol()

export const Never = {
  type: 'foreign',
  value: NeverSym
}

export const Undefined = {
  type: 'foreign',
  value: UndefinedSym
}

export type Any = {
  type: string 
  id?: string
  value?: any
}

export function isString(value: Any) {
  return value.type === 'string'
}

export function isFunction(value: Any) {
  return value.type === 'function'
}

export function isNumber(value: Any) {
  return value.type === 'number'
}

export function isBoolean(value: Any) {
  return value.type === 'boolean'
}

export function isForeign(value: Any) {
  return value.type === 'foreign'
}

export function isNever(value: Any) {
  return value.type === 'foreign' && value.value === NeverSym
}

export function isUndefined(value: Any) {
  return value.type === 'foreign' && value.value === UndefinedSym
}

export function box(value: any): Any {
  if (typeof value === 'function') {
    return { type: 'foreign', value }
  }
  return { type: typeof value, value: value }
}

export function unbox(value: Any, context: any): any {
  if (value.type === 'foreign') {
    if (isUndefined(value) || isNever(value)) {
      return undefined
    } else if (value.id) {
      return context[value.id]
    } else {
      return value.value
    }
  } else {
    return value.value
  }
}

export class Snapshot { 
  id: string 
  week: number
  code: string 
  ast: ESTree.Program
  environment: Array<Map<string, Any>> = []
  done: boolean
  node: ESTree.Node
  valueType: string
  value: Any = Undefined
  context: any = {}

  constructor(
    fields: {
      code?: string,
      ast?: ESTree.Program,
      id?: string,
      week?: number,
      context?: any
    }) {
    Object.assign(this, fields)
  }

  getVar(name: string): Any {
    let value = undefined
    const found = this.environment.some((env) => {
      value = env.get(name)
      return env.has(name)
    })
    if (found) {
      return value
    } else {
      return Never
    }
  }

  setVar(name: string, value: Any) {
    return this.environment[0].set(name, value)
  }

  extend(bindings: Map<string, any>) {
    return this.environment.unshift(bindings)
  }
}

export interface ISnapshotError {
  id: string
  from: string
  line: number
  endLine: number
  column: number
  endColumn: number
  message: string
}

export type Snapshot$ = Observable<Snapshot>
export type Error$ = Observable<ISnapshotError>

export interface ISink {
  snapshot$: Snapshot$,
  error$: Error$
}
