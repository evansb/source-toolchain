import test from 'ava'
import { BANNED, canUse, whenCanUse } from './syntax'

test('BANNED', (t) => {
  t.true(typeof BANNED === 'number')
})

test('canUse', (t) => {
  t.deepEqual(canUse('ArrayExpression', 3), 'no') 
  t.deepEqual(canUse('ArrayExpression', 5), 'yes') 
})

test('whenCanUse', (t) => {
  t.deepEqual(whenCanUse('ArrayExpression'), 5) 
  t.deepEqual(whenCanUse('SpreadElement'), BANNED)
})
