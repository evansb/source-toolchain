import { Map, List } from 'immutable'
import { Observable } from 'rxjs/Observable'

export interface ISnapshot { 
  id: string 
  parentID: string
  week: number
  code: string 
  messages: List<ISnapshotMessage>
  environment?: Map<string, any>
  valueType: string
  value?: any
}

export interface ISnapshotMessage {
  from: string
  header?: string
  code: string
  results: {
    line: number
    endLine?: number
    column: number
    endColumn?: number
    message: string
  }[]
}

export type Snapshot$ = Observable<ISnapshot>
