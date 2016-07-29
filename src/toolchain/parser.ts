/// <reference path='../../typeshims/estraverse.d.ts' />
import { Observable } from 'rxjs/Observable'
import { Snapshot, Snapshot$, SnapshotError, Error$, ISink } from './common'
import { parse as _parse } from 'acorn'
import { traverse } from 'estraverse'
import { whenCanUse } from './syntax'
import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/mergeAll'

function createOutput(node: ESTree.Node, message: string) {
  return new SnapshotError({
    from: 'parser',
    message,
    line: node.loc.start.line,
    column: node.loc.start.column,
    endLine: node.loc.end.line,
    endColumn: node.loc.end.column
  })
}

export function sanitizeFeatures(ast: ESTree.Program, week: number): Error$ {
  return Observable.create((observer) => {
    traverse(ast, {
      enter(node: ESTree.Node): void {
        const minWeek = whenCanUse(node.type)
        if (minWeek > week) {
          const message = `Cannot use ${node.type} until week ${minWeek}`
          observer.next(createOutput(node, message))
        }
      },
      leave(node: ESTree.Node): void {
        if (node.type === 'Program') {
          observer.complete()
        }
      }
    })
  })
}

export function sanitize(ast: ESTree.Program, week: number): Error$ {
  return sanitizeFeatures(ast, week)
}

export function parse(code: string): ESTree.Program | SyntaxError {
  const options = {
    sourceType: 'script',
    ecmaVersion: 5,
    locations: true
  }
  try {
    return _parse(code, options)
  } catch (e) {
    if (e instanceof SyntaxError) {
      return e
    } else {
      throw e
    }
  }
}

export function createParser(snapshot$: Snapshot$, week: number = 3): ISink {
  const parseResult$ = snapshot$.map((snapshot) => {
    const parseResult = _parse(snapshot.code)
    if (parseResult instanceof SyntaxError) {
      const r = <any> parseResult
      const error = new SnapshotError({
        line: r.loc.line,
        column: r.loc.column,
        message: r.message
      })
      return Observable.of(error)
    } else {
      const withAst = snapshot.set('ast', parseResult)
      return Observable.of(
        Observable.of(withAst),
        sanitize(parseResult, snapshot.week)
      ).mergeAll()
    }
  })
  const result$ = parseResult$.mergeAll().filter(p => p instanceof Snapshot) 
  const error$ = parseResult$.mergeAll().filter(p => p instanceof SnapshotError)
  return {
    snapshot$: result$ as Snapshot$,
    error$: error$ as Error$
  }
}
