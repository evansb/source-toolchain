import { createContext } from '../context'
import { parse, FatalSyntaxError } from '../parser'

type Options = {
  week: number
  errorClass: Function
  explanation: RegExp
}

const defaultOptions: Options = {
  week: 3,
  errorClass: FatalSyntaxError,
  explanation: /.*/
}

export const singleError = (source: string, options: Partial<Options>) => {
  const completeOptions: Options = {
    ...defaultOptions,
    ...options
  }
  const { errorClass, week, explanation } = completeOptions
  const context = createContext({ week })
  parse(source, context)
  expect(context.parser.errors.length).toBe(1)
  expect(context.parser.errors[0]).toBeInstanceOf(errorClass)
  expect(context.parser.errors[0].explain()).toMatch(explanation)
}
