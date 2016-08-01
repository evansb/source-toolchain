import { JSHINT } from 'jshint'
import { Observable } from 'rxjs/Observable'
import { ISnapshotError, Snapshot$, Snapshot, Error$, ISink } from './common'
import 'rxjs/add/observable/from'
import 'rxjs/add/observable/concat'
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
export function lint(code: string, snapshot?: Snapshot): ISnapshotError[] { 
  JSHINT(code, LintOptions)
  return (JSHINT.data().errors || []).map((r) => {
    return {
      from: 'linter',
      snapshot: snapshot,
      line: r.line,
      endLine: r.last,
      column: r.character,
      endColumn: r.lastcharacter,
      message: Messages[r.code] || ''
    }
  })
}

export function createLinter(snapshot$: Snapshot$): ISink {
  const sink = snapshot$
    .map((snapshot) =>
      Observable.concat(
        Observable.from(lint(snapshot.code, snapshot)),
        Observable.of(snapshot)
      )
    ).mergeAll()
  return {
    snapshot$: <Snapshot$> sink.filter(s => s instanceof Snapshot),
    error$: <Error$> sink.filter(s => !(s instanceof Snapshot))
  }
}

