import { ErrorType } from '../types/error'
import { explainError } from '../errorUtils'
import { createContext } from '../context'
import { parse } from '../parser'

type Options = {
  week: number
  errorType: ErrorType
  match: RegExp
}

const defaultOptions: Options = {
  week: 3,
  errorType: ErrorType.MatchFailure,
  match: /.*/
}

export const singleError = (source: string, options: Partial<Options>) => {
  const { errorType, week, match } = <Options>{
    ...defaultOptions,
    ...options
  }
  const context = createContext({ week })
  parse(source, context)
  expect(context.parser.errors.length).toBe(1)
  expect(context.parser.errors[0].type).toBe(errorType)
  expect(explainError(context.parser.errors[0])).toMatch(match)
}
