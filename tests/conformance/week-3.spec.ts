import { run, lint, parse } from './utils'

lint('foo + 3')

lint('if (x) 2;')

lint('while (x) x++;')

lint(`"hi" === "hi";`, true)

parse(`[1, [2, 3]];`)

parse(`1 & 2;`)

parse(`if (x) { 2; }`)

parse(`;`)

parse(`var x = 3, y = 4;`)

parse(`var x;`)

parse(`function foo() { return; }`)

parse(`var undefined = 2;`)

run(``, undefined)

run(`1;`, 1)

run('0011;', 9)

run(`'String Literal';`, 'String Literal')

run(`0.333;`, 0.333)

run(`false;`, false)

run(`true;`, true)

run(`1 - 1 + 2 * 3 / 1;`, 6)

run(`1 - (1 + 2 * 3 / 1);`, -6)

run(`if (true) { 2; } else { 3; }`, 2)

run(`if (false) { 2; } else { 3; }`, 3)

run(`var x = 2;`, undefined)

run(`var x = 2; var x = 2;`, undefined)

run(`var x = 2; var y = 2;`, undefined)

run(`-2;`, -2)

run(`+2;`, 2)

run(`!true;`, false)

run(`function foo() {}`, undefined)

run(`(function () { return 2; })()`, 2)

run(`(function (x) { return x + 2; })(3)`, 5)

run(`(function (x, y) { return x + y; })(2, 3)`, 5)

run(`Infinity;`, Infinity)

run(`true ? 2: 3;`, 2)

run(`false ? 2: 3;`, 3)

run(`2 || 3;`, 2)

run(`2 && 3;`, 3)

run(`true || false;`, true)

run(`true && false;`, false)

run(`function addOne(x) { return x + 1; } addOne(3);`, 4)

run(`function rec(x) { return x === 0 ? 0 : rec(x - 1); } rec(3);`, 0)

run(`foreign(3);`, 3, {
  foreign: function(x) { return x; }
})

run(`foreign(function() { return 2; });`, 2, {
  foreign: function(x) { return x(); }
})

run(`foreign(function() { return 2; }, foreign2);`, 5, {
  foreign: function(x, y) { return x() + y(); },
  foreign2: function() { return 3; }
})

run(`var x = foreign2; x()()`, 2, {
  foreign2: function() { return function() { return 2; }; }
})

run(`function foo(x) { return 2 + x; }; foreign2(foo);`, 4, { 
  foreign2: function(f) { return f(2); }
})

run(`true && (true || false) && (!false) && (2 %2 === 0);`, true)

run(`false && x;`, false)

run(`var x = 2; x(3)`, false, {}, true)

run(`function x() { return function() { return 2; } } x() !== x()`, true)

run(`function x() { return function() { return 2; } } x === x;`, true)

run(`function foo(x) { if (x) { return true; } else {} return false; } foo(true);`, true)

run(`Math.floor(2.3)`, 2)

run(`
function decOne(x) {
    if (x <= 0) {
        return x;
    } else {
       return decOne(x - 1);
    }    
}
decOne(1000);
`, 0)
