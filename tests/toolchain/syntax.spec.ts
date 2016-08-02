import test from 'ava'
import { BANNED_OPERATORS, BANNED, canUse, whenCanUse } from '../../src/toolchain/syntax'

test('BANNED', (t) => {
  t.true(typeof BANNED === 'number')
})

test('canUse', (t) => {
  t.deepEqual(canUse('ArrayExpression', 3), 'no') 
  t.deepEqual(canUse('ArrayExpression', 12), 'yes')  
  t.deepEqual(canUse('WhileStatement', 12), 'banned') 
})

test('whenCanUse', (t) => {
  t.deepEqual(whenCanUse('ArrayExpression'), 12) 
  t.deepEqual(whenCanUse('SpreadElement'), BANNED)
})

test('ban all bitwise operator', (t) => {
  t.true(typeof BANNED_OPERATORS === 'object')
  const op = ['&', '|', '>>', '<<', '^', '~']
  op.forEach((x) => {
    t.true(BANNED_OPERATORS[x])
  })
})
