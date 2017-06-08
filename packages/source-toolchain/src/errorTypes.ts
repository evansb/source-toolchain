import * as es from 'estree'

export enum ErrorType {
  AcornParseError,
  CallingNonFunctionValues,
  DeclaratorNotIdentifier,
  IfAlternateNotABlockStatement,
  IfConsequentNotABlockStatement,
  MatchFailure,
  MissingIfAlternate,
  MissingSemicolon,
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
