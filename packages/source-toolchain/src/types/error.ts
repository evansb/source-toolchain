export enum ErrorType {
  /* Syntax Errors */
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
