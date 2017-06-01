import * as es from 'estree'
import { List, Map, Stack } from 'immutable'

export enum SBaseType {
  Number,
  String,
  Function,
}

export type SType = {
  base: SBaseType,
  params?: SType[],
}

export type SUntyped = {
  name: string,
  loc: es.SourceLocation,
}

export type STyped = SUntyped & {
  type: SType,
}

export enum ErrorType {
  AcornParseError,
  MatchFailure,
  MissingIfConsequent,
  MissingIfAlternate,
  MissingSemicolon,
  TrailingComma,
  IfConsequentNotABlockStatement,
  IfAlternateNotABlockStatement,
  DeclaratorNotIdentifier,
  VariableRedeclaration,
  UndefinedVariable,
  CallingNonFunctionValues,
}

export enum ErrorCategory {
  SYNTAX_ERROR,
  SYNTAX_STYLE,
  TYPE_ERROR,
}

export type StudentError = {
  type: ErrorType,
  node: es.Node,
  explanation?: string,
}

export interface Scope {
  parent?: number,
  environment: Map<string, any>,
}

export type Step = {
  state: EvaluatorState,
  before: es.Node,
  after: es.Node,
}

export interface EvaluatorState {
  isRunning: boolean,
  frames: Stack<number>,
  result?: any,
  isReturned?: boolean,
  scopes: Map<number, Scope>
  errors: List<StudentError>,

  // Registers
  value?: any

  // Visualization Stuff
  expressions: Stack<es.Node>,
}

export type Scheduler<T> = (
  initialState: EvaluatorState,
  stepper: IterableIterator<Step>) => T
