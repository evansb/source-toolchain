import { State } from '../src/evaluator'
import { createSession, Session } from '../src/server'

it('createSession correctly creates a session instance', () => {
  const session = createSession(3)
  expect(session).toBeInstanceOf(Session)
  expect(session.week).toBe(3)
})

describe('Session', () => {
  it('initially has undefined state', () => {
    const session = new Session(3)
    expect(session.state).not.toBeDefined()
  })

  it('start creates evaluator with initial state and parsed program', () => {
    const session = new Session(3)
    session.start('var x = 1 + 2;')
    expect(session.state.frames.first()).toBe(0)
    expect(session.state.isRunning).toBe(false)
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
        expect(session.state.node).toBeDefined()
        resolve()
      })
      session.start('var x = 1 + 2; x;')
      session.next()
    })
  })

  it('addCode() evaluates more code', () => {
    const session = new Session(3)
    return new Promise((resolve, reject) => {
      let counter = 0
      session.on('done', () => {
        if (counter === 0) {
          counter++
          expect(session.state.value).not.toBeDefined()
        } else {
          expect(session.state.value).toBe(3)
          resolve()
        }
      })
      session.start('var x = 1 + 2;')
      session.exhaust()
      session.addCode('x;')
      session.exhaust()
    })
  })

  it('addCode() restore state if fatal syntax error happens', () => {
    const session = new Session(3)
    expect.assertions(2)
    return new Promise((resolve, reject) => {
      let counter = 0
      let state: State
      session.on('done', () => {
        if (counter === 0) {
          counter++
          state = session.state
        } else {
          expect(session.state).toBe(state)
          resolve()
        }
      })
      session.on('errors', (errors) => {
        expect(errors.length).toBe(1)
      })
      session.start('var x = 1 + 2;')
      session.exhaust()
      session.addCode('y;')
      session.exhaust()
    })
  })

  it('addCode() throws exception if an evaluation still in progress', () => {
    const session = new Session(3)
    session.start('var x = 1 + 2;')
    expect(() => session.addCode('y;')).toThrow(/in progress/)
  })

  it('exhaust() evaluates program until done', () => {
    const session = new Session(3)
    return new Promise((resolve, reject) => {
      const counter = jest.fn()
      session.on('next', () => {
        counter()
      })
      session.on('done', () => {
        expect(counter.mock.calls.length).toBe(10)
        expect(session.state.isRunning).toBe(false)
        expect(session.state.value).toBe(3)
        resolve()
      })
      session.start('var x = 1 + 2; x;')
      session.exhaust()
    })
  })
})
