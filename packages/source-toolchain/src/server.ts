/**
 * Interactive toolchain Session.
 */

import * as es from 'estree'
import * as EventEmitter from 'eventemitter2'
import * as invariant from 'invariant'

import { ParserState, parse } from './parser'
import { InterpreterState, evalProgram, createState } from './evaluator'
import { VisualizerState, create as createVisualizer, next as nextVisualizer } from './visualizer'

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
  public parser: ParserState

  private isInterpreting: boolean
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
    delete this.parser
    delete this.visualizer

    this.evalCode(code)

    if (this.isInterpreting) {
      this.emit('start')
    }
  }

  /**
   * Evaluate single step of the program.
   */
  next() {
    invariant(this.genInterpreter, 'start() must be called before calling next')

    if (this.isInterpreting) {
      const { value: nextInterpreter } = this.genInterpreter.next()

      // Stop interpreter on error
      if (!nextInterpreter.errors.isEmpty) {
        this.isInterpreting = false
        this.emit('errors', nextInterpreter.errors.toJS())
      }

      // Update states
      this.isInterpreting = nextInterpreter.isRunning
      this.interpreter = nextInterpreter
      this.visualizer = nextVisualizer(this.visualizer, this.interpreter)

      // Emit appropriate events
      if (!this.isInterpreting) {
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
    while (this.isInterpreting) {
      this.next()
    }
  }

  /**
   * Evaluate another code.
   *
   * @param code The code to be evaluated.
   */
  addCode(code: string) {
    invariant(!this.isInterpreting,
      'Cannot add more code when previous evaluation is in progress')

    this.evalCode(code)
    this.emit('start')
  }

  private evalCode(code: string) {
    delete this.genInterpreter

    this.isInterpreting = true
    this.parser = parse(code, this.week, '1.js', this.parser)

    if (this.parser.errors.length > 0) {
      this.isInterpreting = false
      this.emit('errors', this.parser.errors)
      this.emit('done')
    } else {
      this.visualizer = createVisualizer()
      this.interpreter = this.interpreter || createState()
      this.genInterpreter = evalProgram(this.parser.node as es.Program, this.interpreter)
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
