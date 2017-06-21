import { createContext } from '../context'
import { parse, FatalSyntaxError } from '../parser'

type Options = {
  week: number
  errorClass: any
  explanation: RegExp
}

const defaultOptions: Options = {
  week: 3,
  errorClass: FatalSyntaxError,
  explanation: /.*/
}

const runParser = (source: string, week: number) => {
  const context = createContext({ week })
  parse(source, context)
  return context
}

export const singleError = (source: string, options: Partial<Options>) => {
  const completeOptions: Options = {
    ...defaultOptions,
    ...options
  }
  const { errorClass, week, explanation } = completeOptions
  const context = runParser(source, week)
  expect(context.parser.errors.length).toBe(1)
  expect(context.parser.errors[0]).toBeInstanceOf(errorClass)
  expect(context.parser.errors[0].explain()).toMatch(explanation)
}

export const noError = (source: string, options: Partial<Options> = {}) => {
  const completeOptions: Options = {
    ...defaultOptions,
    ...options
  }
  const { errorClass, week, explanation } = completeOptions
  const context = runParser(source, week)
  expect(context.parser.errors.length).toBe(0)
}
