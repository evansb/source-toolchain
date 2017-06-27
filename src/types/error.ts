import * as es from 'estree'

export interface IError {
  location: es.SourceLocation
  explain(): string
  elaborate(): string
}
