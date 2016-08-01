import test from 'ava'
import { Snapshot, unbox } from '../common'
import { parse } from 'acorn'
import { evaluate } from '../interpreter-legacy'

let testCount = 0

function run(code: string, value: any) {
  testCount++;
  const count = testCount
  const ast = parse(code) 
  const snapshot = new Snapshot({ code, ast })
  test(`eval-${count}`, (t) => {
    const result = evaluate(ast, snapshot)
    t.deepEqual(unbox(result, {}), value)
  })
}

// 1
run(``, undefined)

// 2
run(`1;`, 1)

// 3
run(`'String Literal';`, 'String Literal')

// 4
run(`0.333;`, 0.333)

// 5
run(`1 - 1 + 2 * 3 / 1;`, 6)

// 6
run(`1 - (1 + 2 * 3 / 1);`, -6)
