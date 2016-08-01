import test from 'ava'
import { Snapshot, unbox } from '../common'
import { parse } from 'esprima'
import { init, evaluate } from '../interpreter-legacy'

let testCount = 0

function run(code: string, value: any, context?: { [name: string]: any }, isNegative = false) {
  testCount++;
  const count = testCount
  const ast = parse(code) 
  const snapshot = new Snapshot({ code, ast, context })
  init(snapshot, Object.keys(context || {}).filter((k) => context.hasOwnProperty(k)))
  test(`eval-${count}`, (t) => {
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

// 1
run(``, undefined)

// 2
run(`1;`, 1)

// 3
run(`'String Literal';`, 'String Literal')

// 4
run(`0.333;`, 0.333)

// 5
run(`false;`, false)

// 6
run(`true;`, true)

// 7
run(`1 - 1 + 2 * 3 / 1;`, 6)

// 8
run(`1 - (1 + 2 * 3 / 1);`, -6)

// 9
run(`if (true) { 2; } else { 3; }`, 2)

// 10
run(`if (false) { 2; } else { 3; }`, 3)

// 11
run(`var x = 2;`, undefined)

// 12
run(`var x = 2; var x = 2;`, undefined)

// 13
run(`var x = 2; var y = 2;`, undefined)

// 14
run(`-2;`, -2)

// 15
run(`+2;`, 2)

// 16
run(`!true;`, false)

// 17
run(`function foo() {}`, undefined)

// 18
run(`(function () { 2; })()`, 2)

// 19
run(`(function (x) { return x + 2; })(3)`, 5)

// 20
run(`(function (x, y) { return x + y; })(2, 3)`, 5)

// 21
run(`Infinity;`, Infinity)

// 22
run(`true ? 2: 3;`, 2)

// 23
run(`false ? 2: 3;`, 3)

// 24
run(`2 || 3;`, 2)

// 25
run(`2 && 3;`, 3)

// 26
run(`true || false;`, true)

// 27
run(`true && false;`, false)

// 28
run(`function addOne(x) { return x + 1; } addOne(3);`, 4)

// 29
run(`function rec(x) { return x === 0 ? 0 : rec(x - 1); } rec(3);`, 0)

// 30
run(`foreign(3);`, 3, {
  foreign: function(x) { return x; }
})

// 31
run(`foreign(function() { return 2; });`, 2, {
  foreign: function(x) { return x(); }
})

// 32
run(`foreign(function() { return 2; }, foreign2);`, 5, {
  foreign: function(x, y) { return x() + y(); },
  foreign2: function() { return 3; }
})

// 33
run(`var x = foreign2; x()()`, 2, {
  foreign2: function() { return function() { return 2; }; }
})

// 34
run(`function foo(x) { return 2 + x; }; foreign2(foo);`, 4, {
  foreign2: function(f) { return f(2); }
})

// 35
run(`true && (true || false) && (!false) && (2 %2 === 0);`, true)

// 36
run(`false && x;`, false)

// 37
run(`var x = 2; x(3)`, false, {}, true)

// 38
run(`function x() { return function() { return 2; } } x() !== x()`, true)

// 39
run(`function x() { return function() { return 2; } } x === x;`, true)