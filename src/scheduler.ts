import { EvaluatorState } from './evaluator'

export type Scheduler<T> = (initialState: EvaluatorState, stepper: IterableIterator<EvaluatorState>) => T

/**
 * Scheduler that exhaust all the step in a blocking manner
 */
export const blocking: Scheduler<void> = (state, it) => {
  while (state.isRunning) {
    it.next()
  }
}

/**
 * Scheduler that asynchronously evaluate the program by assigning a delay
 * between each step
 * @param delay Minimum time waited per step
 */
export const interval = (delay = 0): Scheduler<Promise<any>> =>
  (state, it): any => {
    return new Promise((resolve, reject) => {
      const ivl = setInterval(() => {
        if (!state.isRunning) {
          clearInterval(ivl)
          resolve(state.result)
        }
        it.next()
      }, delay)
    })
  }
