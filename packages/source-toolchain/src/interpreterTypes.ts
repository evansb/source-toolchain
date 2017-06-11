import * as es from 'estree'
import { Stack, List, Map, Record } from 'immutable'
import { StudentError } from './errorTypes'

export interface Scope {
  parent?: number,
  name: string,
  environment: Map<string, any>,
}

export interface InspectableState {
  node?: es.Node
  value?: any
  _done: boolean
}

const initialState = {
  isRunning: false,
  frames: Stack<number>(),
  scopes: Map<number, Scope>(),
  errors: List<StudentError>(),
  node: undefined,
  value: undefined,

  _isReturned: false,
  _done: false,
}

export class InterpreterState extends Record(initialState)
  implements InspectableState {

  isRunning: boolean
  frames: Stack<number>
  scopes: Map<number, Scope>
  errors: List<StudentError>
  value?: any
  node?: es.Node

  // tslint:disable:variable-name
  _isReturned?: boolean
  _done: boolean

  with(params: Partial<InterpreterState>) {
    return this.merge(params) as this
  }
}
