import { ISnapshotMessage } from './common'
import { linter } from 'eslint'

/// Header which might be appended on lint errors.
export const LINT_ERROR_HEADER = '[!] There are syntax error/warning(s)'

/// Rule indicator for missing semicolon
export const MISSING_SEMICOLON_ID = 'semi'
export const MISSING_SEMICOLON_MESSAGE = 'Error: Missing Semicolon'

const Messages = {
  [MISSING_SEMICOLON_ID]: MISSING_SEMICOLON_MESSAGE
}

/**
 * Lint the source code
 * @param  {string} code The source code
 * @return {ILintResult[]} List of eslint errors/warnings
 */
export function lint(code: string): ISnapshotMessage {
  const results = linter.verify(code, {
    rules: {
      semi: 'error'
    }
  }).map(r => {
    const message = Messages[r.ruleId]
    return {
      line: r.line,
      endLine: r.endLine,
      column: r.column,
      endColumn: r.endColumn,
      message: message || ''
    }
  })
  return {
    header: LINT_ERROR_HEADER,
    results,
    code
  }
}
