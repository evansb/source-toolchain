import * as es from 'estree'

export enum ErrorType {
  AcornParseError,
  CallingNonFunctionValues,
  IfAlternateNotABlockStatement,
  IfConsequentNotABlockStatement,
  MatchFailure,
  MissingIfAlternate,
  MissingSemicolon,
  MultipleDeclarations,
  TrailingComma,
  UndefinedVariable,
  UseStrictEquality,
  UseStrictInequality,
  VariableRedeclaration,
}

export type StudentError = {
  type: ErrorType,
  node: es.Node,
  explanation?: string,
}
