import { Map, List } from 'immutable'

export interface ISnapshot { 
  id: string 
  parentID: string
  week: number
  code: string
  environment?: Map<string, any>
  outputs: List<string>
  valueType: string
  value?: any
}

export interface ISnapshotMessage {
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
