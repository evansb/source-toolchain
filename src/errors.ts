import { Node, Identifier } from 'estree'

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
}

export enum ErrorCategory {
  SYNTAX_ERROR,
  SYNTAX_STYLE,
  TYPE_ERROR,
}

export type StudentError = {
  type: ErrorType,
  node: Node,
  explanation?: string,
}

const splitNodeType = (nodeType: string) => {
  const tokens: string[] = []
  let soFar = ''

  for (let i = 0; i <= nodeType.length; i++) {
    if (nodeType[i] === nodeType[i].toUpperCase() && i > 0) {
      tokens.push(soFar)
      soFar = ''
    } else {
      soFar += nodeType[i]
    }
  }

  return tokens
}

export const getErrorExplanation = (error: StudentError) => {
  switch (error.type) {
    case ErrorType.MatchFailure:
      return `Disallowed language construct (${splitNodeType(error.node.type)})`
    case ErrorType.DeclaratorNotIdentifier:
      return 'Declaring a variable usin a non-identifier'
    case ErrorType.MissingIfAlternate:
      return 'Missing Else case'
    case ErrorType.IfAlternateNotABlockStatement:
      return 'Missing a pair of curly braces around Else'
    case ErrorType.MissingIfConsequent:
      return 'Missing If case'
    case ErrorType.IfConsequentNotABlockStatement:
      return 'Missing a pair ofcurly braces around If'
    case ErrorType.TrailingComma:
      return 'Trailing comma'
    case ErrorType.MissingSemicolon:
      return 'Missing a semicolon at the end of the statement'
    case ErrorType.AcornParseError:
      return `Syntax Error:\n${error.explanation}`
    case ErrorType.VariableRedeclaration:
      const name = (error.node as Identifier).name
      return `Variable redeclaration \n${name}`
    case ErrorType.UndefinedVariable:
      const unName = (error.node as Identifier).name
      return `Undefined variable\n${unName}`
    default:
      return 'Cannot find any explanation, please report this to your Avenger'
  }
}

export const getErrorCategory = (error: StudentError) => {
  switch (error.type) {
    case ErrorType.AcornParseError:
    case ErrorType.MissingSemicolon:
    case ErrorType.DeclaratorNotIdentifier:
    case ErrorType.MatchFailure:
      return ErrorCategory.SYNTAX_ERROR

    case ErrorType.TrailingComma:
    case ErrorType.MissingIfConsequent:
    case ErrorType.MissingIfAlternate:
    case ErrorType.IfConsequentNotABlockStatement:
    case ErrorType.IfAlternateNotABlockStatement:
      return ErrorCategory.SYNTAX_STYLE

    case ErrorType.VariableRedeclaration:
    case ErrorType.UndefinedVariable:
      return ErrorCategory.TYPE_ERROR
  }
}
