import * as es from 'estree'
import { Stack, List, Map, Record } from 'immutable'
import { IError } from './error'

export interface Scope {
  parent?: number
  name: string
  environment: Map<string, any>
}

export interface InspectableState {
  node?: es.Node
  value?: any
  _done: boolean
}

const params = {
  isRunning: false,
  frames: Stack<number>(),
  scopes: Map<number, Scope>(),
  errors: List<IError>(),
  node: undefined,
  value: undefined,

  _isReturned: false,
  _done: false
}

export class InterpreterState extends Record(params)
  implements InspectableState {
  isRunning: boolean
  frames: Stack<number>
  scopes: Map<number, Scope>
  errors: List<IError>
  value?: any
  node?: es.Node

  // tslint:disable:variable-name
  _isReturned?: boolean
  _done: boolean

  with(newParams: Partial<InterpreterState>) {
    return this.merge(newParams) as this
  }
}
