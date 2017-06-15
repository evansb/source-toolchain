/**
 * Interactive toolchain Session.
 */

import * as es from 'estree'
import * as EventEmitter from 'eventemitter2'
import * as invariant from 'invariant'

import { explainError } from './errorUtils'
import { parse } from './parser'
import { StaticState } from './types/static'
import { createContext } from './context'
import { InterpreterState } from './types/dynamic'
import { evalProgram, createInterpreter } from './interpreter'
import {
  VisualizerState,
  create as createVisualizer,
  next as nextVisualizer
} from './visualizer'

/**
 * The instance of this class models an interactive toolchain session.
 *
 * @example
 * const
 */
export class Session extends EventEmitter.EventEmitter2 {
  /** Current interpreter of the interpreter */
  public interpreter: InterpreterState

  /** Current interpreter of the expression visualizer */
  public visualizer: VisualizerState

  /** Current interpreter of the parser visualizer */
  public context: StaticState

  private genInterpreter: Iterator<InterpreterState>

  constructor(public week: number) {
    super()
  }

  /**
   * Re-start the parser, interpreter, and visualizer with
   * a new code. Emits start event when done.
   *
   * @param code The JavaScript code
   */
  start(code: string) {
    delete this.interpreter
    delete this.context
    delete this.visualizer

    this.evalCode(code)

    if (this.interpreter) {
      this.emit('start')
    }
  }

  /**
   * Evaluate single step of the program.
   */
  next() {
    invariant(this.genInterpreter, 'start() must be called before calling next')

    if (this.interpreter.isRunning) {
      const { value: nextInterpreter } = this.genInterpreter.next()

      // Stop interpreter on error
      if (!nextInterpreter.errors.isEmpty) {
        const errors = nextInterpreter.errors.map(error => ({
          ...error,
          explanation: explainError(error!)
        }))
        this.emit('errors', errors.toJS())
      }

      // Update states
      this.interpreter = nextInterpreter
      this.visualizer = nextVisualizer(this.visualizer, this.interpreter)

      // Emit appropriate events
      if (!this.interpreter.isRunning) {
        this.emit('done')
      } else {
        this.emit('next')
      }
    }
  }

  /**
   * Evaluate the remaining program until end.
   */
  untilEnd() {
    while (this.interpreter.isRunning) {
      this.next()
    }
  }

  /**
   * Evaluate another code.
   *
   * @param code The code to be evaluated.
   */
  addCode(code: string) {
    invariant(this.interpreter, 'Must call start() before addCode()')
    invariant(
      !this.interpreter.isRunning,
      'Cannot add more code when previous evaluation is in progress'
    )

    this.evalCode(code)
    this.emit('start')
  }

  private evalCode(code: string) {
    delete this.genInterpreter
    this.context = this.context || createContext({ week: this.week })
    this.context = parse(code, this.context)
    const parserErrors = this.context.parser.errors
    if (parserErrors.length > 0) {
      parserErrors.forEach(error => {
        error.explanation = explainError(error)
      })
      this.emit('errors', parserErrors)
      this.emit('done')
    } else {
      this.visualizer = createVisualizer()
      this.interpreter = (this.interpreter || createInterpreter()).merge({
        isRunning: true
      }) as InterpreterState
      this.genInterpreter = evalProgram(
        this.context.parser.program!,
        this.interpreter
      )
    }
  }
}

/**
 * Create a new session from some configuration.
 *
 * @param week The week of the language to be used.
 * @returns {Session}
 */
export const createSession = (week: number): Session => {
  return new Session(week)
}
