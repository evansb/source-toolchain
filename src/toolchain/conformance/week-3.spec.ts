import test from 'ava'
import { Snapshot } from '../common'
import { run as slowRun } from '../interpreter-imm'
import { parse } from 'acorn'

function run(immEval: boolean, code: string, value: any) {
  return immEval && test('imm-eval: ' + code, (t) => {
    t.plan(1)
    return new Promise<void>((resolve, reject) => {
      const snapshot = new Snapshot({
        code,
        ast: parse(code)
      })
      slowRun(snapshot).subscribe((s) => {
        if (s.done) {
          t.deepEqual(s.value, value)
        }
      }, reject, resolve)
    })
  })
}

run(true, ``, undefined)
run(true, `1;`, 1)
run(true, `'String Literal';`, 'String Literal')
run(true, `0.333;`, 0.333)
