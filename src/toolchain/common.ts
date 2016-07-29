import { Map, Record, Stack } from 'immutable'
import { Observable } from 'rxjs/Observable'

const SnapshotRecord = Record({ 
  id: undefined,
  parent: undefined,
  week: 3,
  code: '' ,
  ast: undefined,
  environment: Map(), 
  stateStack: Stack<State>(),
  done: false,
  node: undefined,
  valueType: 'Undefined',
  value: undefined
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
  environment: Map<string, any>
  done: boolean
  node: ESTree.Node
  valueType: string
  value: any
  stateStack: Stack<State>
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
