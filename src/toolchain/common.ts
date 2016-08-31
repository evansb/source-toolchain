import { Observable } from 'rxjs/Observable'

const NeverSym = Symbol()
const UndefinedSym = Symbol()

/**
 * Bottom value to indicate error
 * @type {Object}
 */
export const Never = {
  type: 'never',
  value: NeverSym
}

/**
 * Boxed version of undefined
 * @type {Object}
 */
export const Undefined = {
  type: 'undefined',
  value: UndefinedSym
}

export type Any = {
  type: string
  id?: string
  value?: any
  isReturn?: boolean
  isTailCall?: boolean
  environment?: Environment
  node?: ESTree.CallExpression
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
  } else if (value instanceof Array) {
    return { type: 'list', value }
  }
  return { type: type || typeof value, value }
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

export class Environment {
  private __env: { [name: string]: Any } = {}

  constructor(private parent?: Environment) {
  }

  get(name: string): [boolean, Any] {
    if (this.__env.hasOwnProperty(name)) {
      return [true, this.__env[name]]
    } else if (this.parent) {
      return this.parent.get(name)
    } else {
      return [false, Undefined]
    }
  }

  set(name: string, value: Any) {
    this.__env[name] = value
  }
}

export class Snapshot {
  id: string
  week: number
  ast: ESTree.Program
  globals: string[] = []
  environment: Environment = this.initialEnvironment()
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
  parent?: Snapshot
  runtime: any

  private _code: string
  private _lines: string[]

  constructor(
    fields: {
      code?: string,
      ast?: ESTree.Program,
      id?: string,
      week?: number,
      context?: any,
      globals?: string[],
      timeout?: number,
      maxCallStack?: number,
      parent?: Snapshot
    }) {
    Object.assign(this, fields)
    this.runtime = fields.parent ? fields.parent.runtime : null
    this.context = fields.context ||
      (fields.parent && fields.parent.context) || this.context
    this.timeout = fields.timeout ||
      (fields.parent && fields.parent.timeout) || this.timeout
    this.week = fields.week ||
      (fields.parent && fields.parent.week) || this.week
    this.maxCallStack = fields.maxCallStack ||
      (fields.parent && fields.parent.maxCallStack) || this.maxCallStack
    this.globals = fields.globals || []
    this.globals.forEach(key =>
      this.environment.set(key, {
        type: 'foreign',
        id: key
      })
    )
  }

  initialEnvironment(): Environment {
    const env = new Environment(this.parent ? this.parent.environment : null)
    env.set('Infinity', { type: 'number', value: Infinity })
    env.set('NaN', { type: 'number', value: NaN })
    env.set('Math', { type: 'object', value: {
      floor: Math.floor,
      sqrt: Math.sqrt,
      log: Math.log,
      exp: Math.exp
    }})
    return env
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
}

export interface ISnapshotError {
  from: string
  severity: string
  sourceFile?: string
  snapshot: Snapshot
  line?: number
  endLine?: number
  column?: number
  endColumn?: number
  message: string
}

export type Snapshot$ = Observable<Snapshot>
export type Error$ = Observable<ISnapshotError>

export type ISink = Observable<Snapshot | ISnapshotError>

export function createError(
  from: string,
  node: ESTree.Node,
  message: string
): ISnapshotError {
  let base = { from, message, severity: 'Error' }
  if (node && node.loc) {
    base = Object.assign(base, {
      sourceFile: (<any> node).sourceFile,
      line: node.loc.start.line,
      column: node.loc.start.column,
      endLine: node.loc.end.line,
      endColumn: node.loc.end.column
    })
  }
  return base
}
