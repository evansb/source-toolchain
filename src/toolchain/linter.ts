import { linter } from 'eslint'

/// Header which might be appended on lint errors.
export const LINT_ERROR_HEADER 
  = '[!] These are valid in JavaScript but not in Source'

/// Rule indicator for missing semicolon
export const MISSING_SEMICOLON_ID = 'semi'
export const MISSING_SEMICOLON_MESSAGE = 'Missing Semicolon'

/**
 * Subset of eslint lint result
 */
export interface ILintResult {
  ruleId?: string
  message: string
  line: number
  endLine: number
  column: number
  endColumn: number
}

/**
 * Lint the source code
 * @param  {string} code The source code
 * @return {ILintResult[]} List of eslint errors/warnings
 */
export function lint(code: string): ILintResult[] {
  return linter.verify(code, {
    rules: {
      semi: 'warn'
    }
  })
}
