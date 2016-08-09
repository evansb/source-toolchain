import { JSHINT } from 'jshint'
import { Observable } from 'rxjs/Observable'
import { ISnapshotError, Snapshot$, Snapshot, ISink } from './common'

/// Header which might be appended on lint errors.
export const LINT_ERROR_HEADER = '[!] There are syntax error/warning(s)'

/// Rule indicator for missing semicolon
export const MISSING_SEMICOLON_ID = 'W033'
export const MISSING_SEMICOLON_MESSAGE = 'Error: Missing Semicolon'

const Messages = {
  [MISSING_SEMICOLON_ID]: MISSING_SEMICOLON_MESSAGE
}

const LintOptions = {
  expr: true,
  curly: true
}

const allowedCode = {
  'W042': true // Leading zeroes
}

/**
 * Lint the source code
 */
export function lint(code: string, snapshot?: Snapshot): ISnapshotError[] { 
  JSHINT(code, LintOptions)
  return (JSHINT.data().errors || [])
    .filter(r => r && r.reason && !(/Unrecoverable/.test(r.reason)))
    .filter(r => !allowedCode[r.code])
    .map((r) => {
      console.log(r.code)
      return {
        from: 'linter',
        snapshot: snapshot,
        line: r && r.line,
        endLine: r && r.last,
        column: r && r.character,
        endColumn: r && r.lastcharacter,
        message: r && (r.reason || (r.code && Messages[r.code]) || '')
      }
    })
}

export function createLinter(snapshot$: Snapshot$): ISink {
  return Observable.create(observer => {
    snapshot$.subscribe(snapshot => {
      const lintResult = lint(snapshot.code, snapshot)
      if (lintResult.length > 0) {
        lint(snapshot.code, snapshot).forEach(e => observer.next(e))
        observer.next(snapshot)
      } else {
        observer.next(snapshot)
      }
    })
  })
}
