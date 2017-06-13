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
  NoDeclarations,
  TrailingComma,
  UndefinedVariable,
  UseStrictEquality,
  UseStrictInequality,
  VariableRedeclaration,
}
