//@ simple expression statement
1 + 2;

//@ variable from literal expression 
var x = 2;
//! x: number

//@ variable from binary Expression
var x = 1 + 2;
var y = x;
//! y: number
//! x: number

//@ simple function application
function foo(x) {
  return x + 3
}
var x = foo(4);
//! x: number

//@ mutual function application
function foo(x) {
  return bar(3);
}
function bar(x) {
  return x + 4
}
var x = foo(4);
//! x: number
