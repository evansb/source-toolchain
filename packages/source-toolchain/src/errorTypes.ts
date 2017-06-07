import * as es from 'estree'

export enum ErrorType {
  AcornParseError,
  CallingNonFunctionValues,
  DeclaratorNotIdentifier,
  IfAlternateNotABlockStatement,
  IfConsequentNotABlockStatement,
  MatchFailure,
  MissingIfAlternate,
  MissingIfConsequent,
  MissingSemicolon,
  TrailingComma,
  UndefinedVariable,
  UseStrictEquality,
  UseStrictInequality,
  VariableRedeclaration,
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
