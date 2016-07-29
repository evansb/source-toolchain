import { Map, Record } from 'immutable'
import { Observable } from 'rxjs/Observable'

const SnapshotRecord = Record({ 
  id: undefined,
  parent: undefined,
  week: 3,
  code: '' ,
  ast: undefined,
  environment: Map(),
  valueReady: false,
  valueType: 'Undefined',
  value: undefined
})

export class Snapshot extends SnapshotRecord { 
  id: string 
  parent: string
  week: number
  code: string 
  ast: ESTree.Program
  environment: Map<string, any>
  valueType: string
  value: any
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
