
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
