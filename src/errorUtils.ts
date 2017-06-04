/**
 * Error reporting utilities.
 */
import { generate } from 'escodegen'
import { StudentError, ErrorType, ErrorCategory } from './errorTypes'

// Split ESTree node type into two words
// e.g FunctionDeclaration -> Function Declaration
const splitNodeType = (nodeType: string) => {
  const tokens: string[] = []
  let soFar = ''

  for (let i = 0; i <= nodeType.length; i++) {
    const isUppercase = nodeType[i] === nodeType[i].toUpperCase()
    if (isUppercase && i > 0) {
      tokens.push(soFar)
      soFar = ''
    } else {
      soFar += nodeType[i]
    }
  }

  return tokens
}

/**
 * Get the explanation string of an error object in English.
 * @param error the error object
 */
export const explainError = (error: StudentError) => {
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
      return `Variable redeclaration \n${(error.node as any).name}`
    case ErrorType.UseStrictEquality:
      return 'Use (===) instead of (==)'
    case ErrorType.UseStrictInequality:
      return 'Use (!==) instead of (!=)'
    case ErrorType.UndefinedVariable:
      return `Undefined variable\n${(error.node as any).name}`
    case ErrorType.CallingNonFunctionValues:
      return `Trying to call non-function value ${generate(error.node)}`
    default:
      return 'Cannot find any explanation, please report this to your Avenger'
  }
}

export const categorizeError = (error: StudentError) => {
  switch (error.type) {
    case ErrorType.AcornParseError:
    case ErrorType.MissingSemicolon:
    case ErrorType.DeclaratorNotIdentifier:
    case ErrorType.MatchFailure:
    case ErrorType.UseStrictEquality:
    case ErrorType.UseStrictInequality:
      return ErrorCategory.SYNTAX_ERROR

    case ErrorType.TrailingComma:
    case ErrorType.MissingIfConsequent:
    case ErrorType.MissingIfAlternate:
    case ErrorType.IfConsequentNotABlockStatement:
    case ErrorType.IfAlternateNotABlockStatement:
      return ErrorCategory.SYNTAX_STYLE

    case ErrorType.VariableRedeclaration:
    case ErrorType.UndefinedVariable:
    case ErrorType.CallingNonFunctionValues:
      return ErrorCategory.TYPE_ERROR
  }
}
