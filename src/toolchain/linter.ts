import { JSHINT } from 'jshint'
import { ISnapshotMessage, Snapshot$ } from './common'

/// Header which might be appended on lint errors.
export const LINT_ERROR_HEADER = '[!] There are syntax error/warning(s)'

/// Rule indicator for missing semicolon
export const MISSING_SEMICOLON_ID = 'W033'
export const MISSING_SEMICOLON_MESSAGE = 'Error: Missing Semicolon'

const Messages = {
  [MISSING_SEMICOLON_ID]: MISSING_SEMICOLON_MESSAGE
}

/**
 * Lint the source code
 */
export function lint(code: string): ISnapshotMessage {
  const options = {
    expr: true
  }
  JSHINT(code, options)
  const results = JSHINT.data().errors.map(r => {
    const message = Messages[r.code]
    return {
      line: r.line,
      endLine: r.last,
      column: r.character,
      endColumn: r.lastcharacter,
      message: message || ''
    }
  })
  return {
    from: 'linter',
    header: LINT_ERROR_HEADER,
    results,
    code
  }
}

export function createLinter(snapshot$: Snapshot$): Snapshot$ {
  return snapshot$.map((snapshot) => {
    const message = lint(snapshot.code)
    snapshot.messages = snapshot.messages.push(message)
    return snapshot
  })
}

