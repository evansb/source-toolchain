import { InterpreterState } from '../src/evaluator'
import { createSession, Session } from '../src/server'

it('createSession correctly creates a session instance', () => {
  const session = createSession(3)
  expect(session).toBeInstanceOf(Session)
  expect(session.week).toBe(3)
})

describe('Session', () => {
  it('initially has undefined interpreter', () => {
    const session = new Session(3)
    expect(session.interpreter).not.toBeDefined()
  })

  it('start creates evaluator with initial interpreter and parsed program', () => {
    const session = new Session(3)
    session.start('var x = 1 + 2;')
    expect(session.interpreter.frames.first()).toBe(0)
    expect(session.interpreter.isRunning).toBe(false)
  })

  it('parses the program on start', () => {
    const session = new Session(3)
    expect.assertions(1)
    return new Promise((resolve, reject) => {
      session.on('errors', (errors) => {
        expect(errors.length).toBe(1)
        resolve()
      })
      session.start('var = 1 + 2;')
    })
  })

  it('next() evaluate single step', () => {
    const session = new Session(3)
    return new Promise((resolve, reject) => {
      session.on('next', () => {
        expect(session.interpreter.node).toBeDefined()
        resolve()
      })
      session.start('var x = 1 + 2; x;')
      session.next()
    })
  })

  it('next() calls visualizer correctly', () => {
    const session = new Session(3)
    return new Promise((resolve, reject) => {
      let done = false
      session.on('next', () => {
        expect(session.visualizer).toBeDefined()
        expect(session.visualizer.root!.type).toBe('BinaryExpression')
        resolve()
      })
      session.start('1 + 2;')
      session.untilEnd()
    })
  })

  it('addCode() evaluates more code', () => {
    const session = new Session(3)
    return new Promise((resolve, reject) => {
      let counter = 0
      session.on('done', () => {
        if (counter === 0) {
          counter++
          expect(session.interpreter.value).not.toBeDefined()
        } else {
          expect(session.interpreter.value).toBe(3)
          resolve()
        }
      })
      session.start('var x = 1 + 2;')
      session.untilEnd()
      session.addCode('x;')
      session.untilEnd()
    })
  })

  it('addCode() restore interpreter if fatal syntax error happens', () => {
    const session = new Session(3)
    expect.assertions(2)
    return new Promise((resolve, reject) => {
      let counter = 0
      let state: InterpreterState
      session.on('done', () => {
        if (counter === 0) {
          counter++
          state = session.interpreter
        } else {
          expect(session.interpreter).toBe(state)
          resolve()
        }
      })
      session.on('errors', (errors) => {
        expect(errors.length).toBe(1)
      })
      session.start('var x = 1 + 2;')
      session.untilEnd()
      session.addCode('y;')
      session.untilEnd()
    })
  })

  it('addCode() throws exception if an evaluation still in progress', () => {
    const session = new Session(3)
    session.start('var x = 1 + 2;')
    expect(() => session.addCode('y;')).toThrow(/in progress/)
  })

  it('untilEnd() evaluates program until done', () => {
    const session = new Session(3)
    return new Promise((resolve, reject) => {
      const counter = jest.fn()
      session.on('next', () => {
        counter()
      })
      session.on('done', () => {
        expect(counter.mock.calls.length).toBe(10)
        expect(session.interpreter.isRunning).toBe(false)
        expect(session.interpreter.value).toBe(3)
        resolve()
      })
      session.start('var x = 1 + 2; x;')
      session.untilEnd()
    })
  })
})
