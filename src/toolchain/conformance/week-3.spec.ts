import test from 'ava'
import { Snapshot } from '../common'
import { run as slowRun } from '../interpreter-imm'
import { parse } from 'acorn'
import { evaluate } from '../interpreter-legacy'

let testCount = 0

function run(immEval: boolean, code: string, value: any) {
  testCount++;
  const count = testCount
  const ast = parse(code) 
  const snapshot = new Snapshot({ code, ast })
  test(`eval-${count}`, (t) => {
    const result = evaluate(ast, snapshot, {})
    t.deepEqual(result.unbox(result.value, {}), value)
  })
  evaluate(ast, snapshot, {})
  return immEval && test(`imm-eval-${count}`, (t) => {
    t.plan(1)
    return new Promise<void>((resolve, reject) => {
      slowRun(snapshot).subscribe((s) => {
        if (s.done) {
          t.deepEqual(s.unbox(s.value, {}), value)
        }
      }, reject, resolve)
    })
  })
}

// 1
run(false, ``, undefined)

// 2
run(false, `1;`, 1)

// 3
run(false, `'String Literal';`, 'String Literal')

// 4
run(false, `0.333;`, 0.333)

// 5
run(false, `1 - 1 + 2 * 3 / 1;`, 6)

// 6
run(false, `1 - (1 + 2 * 3 / 1);`, -6)
