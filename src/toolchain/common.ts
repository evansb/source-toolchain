import { Map, Record, Stack } from 'immutable'
import { Observable } from 'rxjs/Observable'

export type Value = {
  type: string
  value: any
}

export type Foreign = {
  type: string
  id: string
}

export type InlineForeign = {
  type: string
  value: any
}

export type Any = Foreign | Value | InlineForeign

export const NEVER: Foreign = {
  type: 'foreign',
  id: 'never'
}

export const UNDEFINED: Value = {
  type: 'undefined',
  value: undefined
}

const SnapshotRecord = Record({  
  id: undefined,
  parent: undefined,
  week: 3,
  code: '' ,
  ast: undefined,
  environment: Stack(), 
  stateStack: Stack<State>(),
  done: false,
  node: undefined,
  valueType: 'Undefined',
  value: UNDEFINED
})

const StateRecord = Record({
  done: false,
  node: undefined,
  scope: undefined, 
  thisExpression: undefined,
  value: undefined,
  n_: undefined
})

export class State extends StateRecord {
  done: boolean
  node: ESTree.Node
  scope: any
  thisExpression: any
  value: any
  n_: number
}

export class Snapshot extends SnapshotRecord { 
  id: string 
  parent: string
  week: number
  code: string 
  ast: ESTree.Program
  environment: Stack<Map<string, Any>>
  done: boolean
  node: ESTree.Node
  valueType: string
  value: Any
  stateStack: Stack<State>

  constructor(init: any) {
    super(init)
  }

  box(value: any): Any {
    if (typeof value === 'function') {
      return <InlineForeign> {
        type: 'foreign_inline',
        value
      }
    }
    return {
      type: typeof value,
      value: value
    }
  }

  unbox(value: Any, context: any): any {
    if (value.type === 'foreign') {
      return context[(<Foreign> value).id]
    } else {
      return (<Value> value).value
    }
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
      return NEVER
    }
  }

  setVar(name: string, value: Any): this {
    return <this> this.set('environment',
      this.environment.shift().unshift(
        this.environment.peek().set(name, value)
      )
    )
  }

  extend(bindings: Map<string, any>): this {
    return <this> this.set('environment', this.environment.unshift(bindings))
  }
}

const SnapshotErrorRecord = Record({
  id: undefined,
  from: undefined,
  line: undefined,
  endLine: undefined,
  column: undefined,
  endColumn: undefined,
  message: undefined
})

export class SnapshotError extends SnapshotErrorRecord {
  id: string
  from: string
  line: number
  endLine: number
  column: number
  endColumn: number
  message: string
}

export type Snapshot$ = Observable<Snapshot>
export type Error$ = Observable<SnapshotError>

export interface ISink {
  snapshot$: Snapshot$,
  error$: Error$
}
