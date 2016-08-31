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

const allowedCode = (week: number) => {
  let base: any = {
    'E030': true,   // Weird string error
    'W014': true    // Bad line breaking before ?
  }
  if (week >= 4) {
    base.W032 = true // Unecccessary Semicolon
  }
  return base
}

const isWarning = {
  'W046': true, // Leading zeroes,
  'W018': true  // Confusing use of !
}

/**
 * Lint the source code
 */
export function lint(code: string, snapshot?: Snapshot): ISnapshotError[] {
  JSHINT(code, LintOptions)
  const allowed = allowedCode(snapshot.week)
  return (JSHINT.data().errors || [])
    .filter(r => r && r.reason && !(/Unrecoverable/.test(r.reason)))
    .filter(r => !allowed[r.code])
    .filter(r => {
      return !((
        (r.code === 'W033' || r.code === 'E058')
        && /;/.test(r.evidence.trim())))
    })
    .map((r) => {
      return {
        from: 'linter',
        snapshot: snapshot,
        line: r && r.line,
        endLine: r && r.last,
        column: r && r.character,
        endColumn: r && r.lastcharacter,
        message: r && (r.reason || (r.code && Messages[r.code]) || ''),
        severity: isWarning[r.code] ? 'warning' : 'error'
      }
    })
}

export function createLinter(snapshot$: Snapshot$): ISink {
  return Observable.create(observer => {
    snapshot$.subscribe(snapshot => {
      const lintResult = lint(snapshot.code, snapshot)
      const errorCount = lintResult.filter((s) => s.severity === 'error').length
      lintResult.forEach(e => observer.next(e))
      if (errorCount === 0) {
        observer.next(snapshot)
      }
    })
  })
}
