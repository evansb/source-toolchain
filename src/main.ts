import 'babel-polyfill'
import * as es from 'estree'
import { Map, Stack } from 'immutable'

import { Scheduler } from './scheduler'
import { evalProgram, Scope, State } from './evaluator'

export { parse } from './parser'

export {
  blocking as blockingScheduler,
  interval as intervalScheduler
} from './scheduler'

export const evaluate = <T>(program: es.Program, scheduler: Scheduler<T>) => {
  const globalScope: Scope = {
    parent: undefined,
    environment: Map<string, any>(),
  }

  const state: State = new State({
    isRunning: false,
    frames: Stack.of(0),
    scopes: Map.of(0, globalScope),
    errors: [],
    expressions: [],
  })

  const stepper = evalProgram(program, state)

  return scheduler(state, stepper)
}
