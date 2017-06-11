/**
 * Error reporting utilities.
 */
import { generate } from 'escodegen'
import { StudentError, ErrorType } from './errorTypes'

// Split ESTree node type into two words
// e.g FunctionDeclaration -> Function Declaration
const splitNodeType = (nodeType: string) => {
  const tokens: string[] = []
  let soFar = ''

  for (let i = 0; i < nodeType.length; i++) {
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
 *
 * @param error the error object
 */
export const explainError = (error: StudentError) => {
  switch (error.type) {
    case ErrorType.MatchFailure:
      return `${splitNodeType(error.node.type)} is not allowed`
    case ErrorType.MultipleDeclarations:
      return 'Split into multiple declarations'
    case ErrorType.MissingIfAlternate:
      return 'Missing "else" case'
    case ErrorType.IfAlternateNotABlockStatement:
      return 'Missing a pair of curly braces around "else"'
    case ErrorType.IfConsequentNotABlockStatement:
      return 'Missing a pair of curly braces around "if"'
    case ErrorType.TrailingComma:
      return 'Trailing comma'
    case ErrorType.MissingSemicolon:
      return 'Missing a semicolon at the end of the statement'
    case ErrorType.AcornParseError:
      return `Syntax Error: ${error.explanation}`
    case ErrorType.VariableRedeclaration:
      return `Variable redeclaration: ${(error.node as any).name}`
    case ErrorType.UseStrictEquality:
      return 'Use (===) instead of (==)'
    case ErrorType.UseStrictInequality:
      return 'Use (!==) instead of (!=)'
    case ErrorType.UndefinedVariable:
      return `Undefined variable\n${(error.node as any).name}`
    case ErrorType.CallingNonFunctionValues:
      return `Trying to call non-function value: ${generate(error.node)}`
    default:
      return 'Cannot find any explanation, please report this issue'
  }
}
