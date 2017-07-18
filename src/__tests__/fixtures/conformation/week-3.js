0; // 0
('A String'); // 'A String'
false; // false
true; // true

1 < 2; // true
1 <= 2; // true
1 >= 10; // false
1 > 10; // false

1 + 2; // 3
3 * 2; // 6
4 - 1; // 3
+10; // 10
-10; // -10
true ? 2 : 3; // 2
false ? 2 : 3; // 3
-(-(-3)); // -3

var a = true; // undefined
var b = false; // undefined

if (a) {
  2;
} else {
  3;
} // 2

if (b) {
  2;
} else {
  3;
} // 3

if (b) {
  1;
} else if (b) {
  2;
} else {
  3;
} // 3

function foo() {} // undefined

var x = 2; // undefined

var y = x + 3; // undefined

y; // 5

function boo(x) {
  return x + 2;
} // undefined

x; // 2

boo(5); // 7

function callme(f) {
  return f(4);
} // undefined

callme(boo); // 6

function compose(f, g) {
  return function(x) {
    return f(g(x));
  };
} // undefined

function loo(x) {
  return x * 2;
} // undefined

compose(boo, loo)(4); // 10

1 + 2 + (true ? 3 + 4 : 5) + (false ? 2 * 4 * (true ? 2 : 3) : 4); // 14

1 || 2; // 1

1 && 2; // 2

false && true; // false

function arith(n) {
  if (n === 0) {
    return 0;
  } else {
    return n + arith(n - 1);
  }
} // undefined

arith(4); // 10
