import test from 'ava'
import { Any, Snapshot, Undefined, Never, unbox } from './common'
import { init } from './interpreter-legacy'

test('init', (t) => {
  const context = {
    'undefined': undefined,
    'x': 3
  }
  const snapshot = new Snapshot({ code: 'function foo()' })
  const globals = new Map<string, Any>()
  globals.set('x', {
    type: 'foreign',
    id: 'x'
  })
  globals.set('undefined', Undefined) 
  t.deepEqual<Any>(snapshot.getVar('undefined'), Never) 
  t.deepEqual<Any>(snapshot.getVar('x'), Never) 

  init(snapshot, globals)
  t.deepEqual<Any>(snapshot.getVar('x'), { type: 'foreign', id: 'x' })   
  t.deepEqual<any>(unbox(snapshot.getVar('x'), context), 3)
  t.deepEqual<Any>(snapshot.getVar('undefined'), Undefined)
})
