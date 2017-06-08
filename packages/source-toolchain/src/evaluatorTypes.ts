import * as es from 'estree'
import { Stack, List, Map } from 'immutable'

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

export interface EvaluatorState extends InspectableState {
  isRunning: boolean,
  frames: Stack<number>,
  scopes: Map<number, Scope>
  errors: List<StudentError>,
  _isReturned?: boolean,
}
