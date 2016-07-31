import test from 'ava'
import { Any, Snapshot, NEVER } from './common'
import { init } from './interpreter-legacy'

test('init', (t) => {
  const context = {
    'undefined': undefined,
    'x': 3
  }
  const snapshot = new Snapshot({ code: 'function foo()' })
  const afterInit = init(snapshot, {
    'x': { type: 'foreign', id: 'x' },
    'undefined': { type: 'foreign', id: 'undefined' }
  })
  t.deepEqual(snapshot.getVar('undefined'), NEVER) 
  t.deepEqual(snapshot.getVar('x'), NEVER) 
  t.deepEqual<Any>(afterInit.getVar('x'), { type: 'foreign', id: 'x' })   
  t.deepEqual<Any>(afterInit.unbox(afterInit.getVar('x'), context), 3)
  const shouldBeUndefined = afterInit.unbox(
    afterInit.getVar('undefined'),
    context
  )
  t.true(typeof shouldBeUndefined === 'undefined')
})
