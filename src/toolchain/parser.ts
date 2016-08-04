/// <reference path='../../typeshims/estraverse.d.ts' />
import { Observer } from 'rxjs/Observer'
import { Observable } from 'rxjs/Observable'
import { ISnapshotError, Error$, ISink, createError, Snapshot } from './common'
import { parse as _parse } from 'esprima'
import { traverse } from 'estraverse'
import { whenCanUse, BANNED_OPERATORS } from './syntax'

import 'rxjs/add/observable/merge'
import 'rxjs/add/operator/filter'
import 'rxjs/add/observable/concat'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/mergeAll'

type Sanitizer<N extends ESTree.Node> = (node: N, week?: number) => string

const saniziters: { [index: string]: Sanitizer<any> } = {
  BinaryExpression: (node: ESTree.BinaryExpression) => {
    if (BANNED_OPERATORS[node.operator]) {
      return `Operator ${node.operator} is only available in Javascript`
    }
  },
  VariableDeclaration: (node: ESTree.VariableDeclaration) => {
   const declarations = (<ESTree.VariableDeclaration> node).declarations
   if (declarations.length > 1) {
      return `This style of variable declaration is only available in Javascript`
    } 
  },
  VariableDeclarator: (node: ESTree.VariableDeclarator) => {
    if (!node.init) {
      return `Missing value in variable declaration`
    }
    if ((<ESTree.Identifier> node.id).name === 'undefined') { 
      return `Cannot redefine the constant 'undefined'`
    }
  },
  IfStatement: (node: ESTree.IfStatement) => { 
    if (!node.alternate) {
      return `Missing else statement`
    }
  },
  EmptyStatement: (node: ESTree.EmptyStatement, week: number) => {
    if (week < whenCanUse('EmptyStatement')) {
      return `Perhaps this is an extra semicolon`
    }
  },
  ReturnStatement: (node: ESTree.ReturnStatement, week: number) => {
    if (week < whenCanUse('EmptyStatement') && !node.argument) {
      return `Missing return value`
    }
  }
}

function runSanitizer<N extends ESTree.Node>(
  sanitizer: Sanitizer<N>,
  node: N,
  week: number,
  observer: Observer<ISnapshotError>): boolean {
  let error
  if (error = sanitizer(node, week)) {
    observer.next(createError('parser', node, error))
    return true
  }
  return false
}

export function sanitizeFeatures(observer: Observer<ISnapshotError>, node: ESTree.Node, week: number) {
  const minWeek = whenCanUse(node.type)
  if (minWeek > week) {
    const message = `Cannot use ${node.type} until week ${minWeek}`
    observer.next(createError('parser', node, message))
  }
}

export function sanitize(ast: ESTree.Program, week: number): Error$ {
  return Observable.create((observer) => {
    traverse(ast, {
      enter(node: ESTree.Node): void {
        sanitizeFeatures(observer, node, week)
        if (saniziters.hasOwnProperty(node.type)) {
          runSanitizer(saniziters[node.type], node, week, observer)
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

export function parse(code: string): ESTree.Program | SyntaxError {
  const options = {
    sourceType: 'script',
    loc: true
  }
  try {
    return _parse(code, options)
  } catch (e) {
    return e
  }
}

export function createParser(snapshot$: ISink, week: number = 3): ISink {
  return Observable.create(observer => {
    snapshot$.subscribe(s => {
      if (!(s instanceof Snapshot)) { observer.next(s) }
      const snapshot = <Snapshot> s
      const parseResult = parse(snapshot.code)
      if (parseResult instanceof Error) {
        const r = <any> parseResult
        const error = {
          snapshot,
          line: r.lineNumber,
          column: r.index,
          message: r.message
        }
        return observer.next(error)
      } else {
        let errored = false
        snapshot.ast = parseResult
        sanitize(parseResult, snapshot.week)
          .map((s) => Object.assign(s, { snapshot }))
          .subscribe(
            (e) => { errored = true; observer.next(e) },  
            (e) => observer.next(e),
            () => {
              if (!errored) {
                observer.next(snapshot)
              }
            })
      } 
    })
  })
}
