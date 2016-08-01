import { Observable } from 'rxjs/Observable'

const NeverSym = Symbol()
const UndefinedSym = Symbol()

export const Never = {
  type: 'never',
  value: NeverSym
}

export const Undefined = {
  type: 'undefined',
  value: UndefinedSym
}

export type Any = {
  type: string 
  id?: string
  value?: any
}

export function isForeign(value: Any) {
  return value.type === 'foreign'
}

export function isNever(value: Any) {
  return value.type === 'never' && value.value === NeverSym
}

export function isUndefined(value: Any) {
  return value.type === 'undefined' && value.value === UndefinedSym
}

export function isTruthy(value: Any) {
  return value.value && !isUndefined(value) && !isNever(value)
}

export function box(value: any, type?: string): Any {
  if (typeof value === 'function') {
    return { type: 'foreign', value }
  }
  return { type: type || typeof value, value: value }
}

export function unbox(value: Any, context: any): any {
  if (isUndefined(value) || isNever(value)) {
      return undefined
  }
  if (value.type === 'foreign') {
     if (value.id) {
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
  ast: ESTree.Program
  environment: Array<Map<string, Any>> = [this.initialEnvironment()]
  done: boolean
  node: ESTree.Node
  valueType: string
  value: Any = Undefined
  context: any = {}
  startTime: Date = new Date()
  callStack: Array<ESTree.CallExpression> = []
  maxCallStack: number
  timeout: number
  currentNode: ESTree.Node

  private _code: string 
  private _lines: string[]

  constructor(
    fields: {
      code?: string,
      ast?: ESTree.Program,
      id?: string,
      week?: number,
      context?: any,
      timeout?: number,
      maxCallStack?: number
    }) {
    Object.assign(this, fields)
  }

  initialEnvironment() {
    const map = new Map()
    map.set('Infinity', { type: 'number', value: Infinity })
    map.set('NaN', { type: 'number', value: NaN })
    return map
  }

  get code() {
    return this._code
  }

  get lines() {
    return this._lines
  }

  set code(c: string) {
    this._code = c
      .replace(new RegExp('\r\n', 'g'), '\n')
      .replace(new RegExp('\r', 'g'), '\n')
    this._lines = this._code.split('\n')
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
}

export interface ISnapshotError {
  from: string 
  snapshot?: Snapshot
  line?: number
  endLine?: number
  column?: number
  endColumn?: number
  message: string
}

export type Snapshot$ = Observable<Snapshot>
export type Error$ = Observable<ISnapshotError>

export interface ISink {
  snapshot$: Snapshot$,
  error$: Error$
}

export function createError(
  from: string,
  node: ESTree.Node,
  message: string
): ISnapshotError { 
  let base = { from, message }
  if (node && node.loc) {
    base = Object.assign(base, {
      line: node.loc.start.line,
      column: node.loc.start.column,
      endLine: node.loc.end.line,
      endColumn: node.loc.end.column
    })
  }
  return base
}
