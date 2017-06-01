import { State } from '../evaluator'
import { blocking, interval } from '../scheduler'

describe('Blocking scheduler', () => {
  it('calls next on generator until state is not running', () => {
    const state = { isRunning: true }
    const foo = jest.fn()
    const mockEvaluator = function*(): any {
      yield foo(1)
      yield foo(2)
      yield state.isRunning = false
      yield foo(3)
    }
    blocking(state as State, mockEvaluator())
    expect(state.isRunning).toBe(false)
    expect(foo.mock.calls).toEqual([[1], [2]])
  })
})

describe('Interval scheduler', () => {
  it('calls next on generator on interval', () => {
    expect.assertions(3)
    return new Promise((resolve, reject) => {
      const state = { isRunning: true }
      const foo = jest.fn()
      const mockEvaluator = function*(): any {
        yield foo(1)
        yield foo(2)
        yield state.isRunning = false
        yield foo(3)
      }
      const scheduler = interval(50)
      setTimeout(() => {
        expect(foo.mock.calls.length).toBe(1)
      }, 25)
      setTimeout(() => {
        expect(foo.mock.calls.length).toBe(2)
      }, 75)
      scheduler(state as State, mockEvaluator()).then(() => {
        expect(foo.mock.calls.length).toBe(3)
        resolve()
      })
    })
  })
})
