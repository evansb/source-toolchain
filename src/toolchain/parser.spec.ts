import test from 'ava'
import * as parser from './parser'
import { Observable } from 'rxjs/Observable'
import { Snapshot } from './common'
import 'rxjs/add/operator/take'
import 'rxjs/add/observable/of'

const s_basic = `
  1 + 2;
`

const s_array = `
  [1, [2, 3]];
`

test('sanitize basic', (t) => { 
  const ast = parser.parse(s_basic)
  t.plan(0)
  return new Promise<void>((resolve, reject) => {
    parser
      .sanitize(<ESTree.Program> ast, 3).take(1)
      .subscribe(() => t.pass(), reject, resolve)
  })
})

test('sanitize banned feature', (t) => { 
  const ast = <ESTree.Program> parser.parse(s_array)
  t.plan(4)
  return new Promise<void>((resolve, reject) => {
    parser
      .sanitize(ast, 3).take(2)
      .subscribe((err) => {
        t.regex(err.message, /ArrayExpression/)
        t.regex(err.message, /Cannot use/)
      }, reject, resolve)
  })
})

test('createParser', (t) => {
  t.plan(2)
  const snapshot$ = Observable.of(
    new Snapshot({ code: s_basic }),
    new Snapshot({ code: s_array, week: 3 })
  )
  const parser$ = parser.createParser(snapshot$)
  return new Promise<void>((resolve, reject) => {
    let count = 0
    parser$.snapshot$.subscribe((s) => {
      count++
      t.deepEqual(s.ast.type, 'Program')
      if (count === 2) {
        resolve()
      }
    })
  })
})
