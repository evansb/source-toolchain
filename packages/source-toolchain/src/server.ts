import * as es from 'estree'
import * as EventEmitter from 'eventemitter2'
import { Map, Stack, List } from 'immutable'
import { StudentError, ErrorCategory } from './errorTypes'
import { categorizeError } from './errorUtils'
import { parse, ParserState } from './parser'
import { State, Scope, evalProgram } from './evaluator'

export class Session extends EventEmitter.EventEmitter2 {
  public state: State
  private backup?: State
  private inProgress: boolean
  private evaluator: Iterator<State>
  private parserState: ParserState

  constructor(public week: number) {
    super()
  }

  start(code: string) {
    delete this.state
    this.evalCode(code)
    this.emit('start')
  }

  next() {
    if (this.evaluator && this.inProgress) {
      const result = this.evaluator.next()
      if (!result.value.errors.isEmpty) {
        this.inProgress = false
        this.emit('errors', result.value.errors.toJS())
      } else {
        this.inProgress = result.value.isRunning
        this.state = result.value
        if (!this.inProgress) {
          this.emit('done')
        } else {
          this.emit('next')
        }
      }
    }
  }

  exhaust() {
    while (this.inProgress) {
      this.next()
    }
  }

  addCode(code: string) {
    if (this.inProgress) {
      throw new Error('Cannot add more code when previous evaluation is in progress')
    } else {
      this.evalCode(code)
    }
  }

  private evalCode(code: string) {
    delete this.evaluator
    this.inProgress = true
    this.parserState = parse(code, this.week, '1.js', this.parserState)
    if (this.parserState.errors.length > 0) {
      for (const error of this.parserState.errors) {
        const category = categorizeError(error)
        if (category === ErrorCategory.SYNTAX_ERROR ||
            category === ErrorCategory.TYPE_ERROR) {
          this.inProgress = false
          this.emit('done')
        }
      }
      this.emit('errors', this.parserState.errors)
    }
    if (this.inProgress && this.parserState.node) {
      this.state = this.state || this.createInitialState()
      this.evaluator = evalProgram(
        this.parserState.node as es.Program, this.state)
    }
  }

  private createInitialState() {
    const globalScope: Scope = {
      parent: undefined,
      name: '_global_',
      environment: Map<string, any>(),
    }

    return new State({
      isRunning: false,
      frames: Stack.of(0),
      scopes: Map.of(0, globalScope),
      errors: List(),
    })
  }
}

export const createSession = (week: number): Session => {
  return new Session(week)
}
