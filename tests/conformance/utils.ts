import test from 'ava'
import { Snapshot, unbox } from '../../src/toolchain/common'
import { parse as _parse, sanitize } from '../../src/toolchain/parser'
import { evaluate } from '../../src/toolchain/interpreter-legacy'
import { lint as _lint } from '../../src/toolchain/linter'

let testCount = 0

export function lint(code: string, isNegative = false) { 
  testCount++
  test(`lint-${testCount}`, (t) => {
    const snapshot = new Snapshot({ code }) 
    if (isNegative) {
      console.log(_lint(snapshot.code))
      t.false(_lint(snapshot.code).length > 0)
    } else {
      t.true(_lint(snapshot.code).length > 0)
    }
  })
}

export function parse(code: string, week: number = 3) {
  testCount++
  test(`parse-${testCount}`, (t) => {
    const ast = _parse(code)
    let errored = false
    return new Promise<void>((resolve, reject) => {
      sanitize(<ESTree.Program> ast, week)
        .subscribe(() => { errored = true; t.pass() },
        reject, () => {
          if (errored) {
            t.pass()
          } else {
            t.fail()
          }
          resolve()
        })
    })
  })
}

export function run(code: string, value: any, context?: { [name: string]: any }, isNegative = false) { 
  testCount++
  const count = testCount
  const ast = <ESTree.Program> _parse(code) 
  const snapshot = new Snapshot({ code, ast, context })
  init(snapshot, Object.keys(context || {}).filter((k) => context.hasOwnProperty(k)))
  test(`run-${count}`, (t) => {
    try {
      const result = evaluate(ast, snapshot)
      t.deepEqual(unbox(result, {}), value)
    } catch (e) {
      if (isNegative) {
        t.pass()
      } else {
        t.fail(`Test ${count} failed because ${e.message}`)
      }
    }
  })
}
