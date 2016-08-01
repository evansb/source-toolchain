import { JSHINT } from 'jshint'
import { Observer } from 'rxjs/Observer'
import { Observable } from 'rxjs/Observable'
import { ISnapshotError, Snapshot$, Snapshot, Error$, ISink } from './common'
import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/mergeAll'

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

/**
 * Lint the source code
 */
export function lint(snapshot: Snapshot): Observable<Snapshot | ISnapshotError> {
  return Observable.create((observer: Observer<Snapshot | ISnapshotError>) => {
    JSHINT(snapshot.code, LintOptions)
    const errors = JSHINT.data().errors || []
    errors.forEach((r) => {
      const error = {
        id: snapshot.id,
        from: 'linter',
        line: r.line,
        endLine: r.last,
        column: r.character,
        endColumn: r.lastcharacter,
        message: Messages[r.code] || ''
      }
      observer.next(error)
    })
    if (errors.length === 0) {
      observer.next(snapshot) 
    }
    observer.complete()
  })
}

export function createLinter(snapshot$: Snapshot$): ISink {
  const sink = snapshot$.map((snapshot) => lint(snapshot)).mergeAll()
  return {
    snapshot$: <Snapshot$> sink.filter((p) => p instanceof Snapshot),
    error$: <Error$> sink.filter((p) => !(p instanceof Snapshot))
  }
}

