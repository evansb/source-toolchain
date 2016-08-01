import test from 'ava'
import * as parser from './parser'
import { Observable } from 'rxjs/Observable'
import { Snapshot } from './common'
import 'rxjs/add/operator/take'
import 'rxjs/add/observable/of'

const s_basic = `
  1 + 2;
`
negativeSanitize(s_basic, 'basic', 5)

const s_array = `
  [1, [2, 3]];
`
positiveSanitize(s_array, 'array literal +', 3, 2)
negativeSanitize(s_array, 'array literal -', 13)

const s_bitwise = `
  1 & 2;
`
positiveSanitize(s_bitwise, 'binary operator')

const s_if_wo_else = `
  if (x) { 2; }
`
positiveSanitize(s_if_wo_else, 'if without else')

const s_empty_statement = `
  ;
`
positiveSanitize(s_empty_statement, 'empty statement', 3, 2)

const s_multiple_decls = `
  var x = 3, y = 4;
`
positiveSanitize(s_multiple_decls, 'multiple decls')

const s_missing_init = `
  var x;
`
positiveSanitize(s_missing_init, 'missing init')

const s_missing_return_value = `
  function foo() {
    return;
  }
`
positiveSanitize(s_missing_return_value, 'missing return value +', 3)
negativeSanitize(s_missing_return_value, 'missing return value -', 4)

const s_redefine_undefined = `
  var undefined = 2;
`
positiveSanitize(s_redefine_undefined, 'redefine undefined', 3)

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

function positiveSanitize(code: string, name: string, week: number = 3, plan: number = 1) {
  test(`sanitize:${name}`, (t) => {
    const ast = parser.parse(code)
    t.plan(plan)  
    return new Promise<void>((resolve, reject) => {
      parser
        .sanitize(<ESTree.Program> ast, week)
        .subscribe(() => t.pass(), reject, resolve)
    })
  })
}

function negativeSanitize(code: string, name: string, week: number = 3) {
  test(`sanitize:${name}`, (t) => {
    const ast = parser.parse(code)
    t.plan(0)  
    return new Promise<void>((resolve, reject) => {
      parser
        .sanitize(<ESTree.Program> ast, week)
        .subscribe(() => t.fail(), reject, resolve)
    })
  })
}
