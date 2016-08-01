import test from 'ava'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/observable/of'
import { Any, Snapshot, Never, unbox, isUndefined, ISnapshotError } from './common'
import { init, createEvaluator } from './interpreter-legacy'
import { parse } from './parser'

test('init', (t) => {
  const context = {
    'undefined': undefined,
    'x': 3
  }
  const snapshot = new Snapshot({ code: 'function foo()' })
  t.deepEqual<Any>(snapshot.getVar('undefined'), Never) 
  t.deepEqual<Any>(snapshot.getVar('x'), Never) 

  init(snapshot, ['undefined', 'x'])

  t.deepEqual<Any>(snapshot.getVar('x'), { type: 'foreign', id: 'x' })   
  t.deepEqual<any>(unbox(snapshot.getVar('x'), context), 3)
  t.true(typeof unbox(snapshot.getVar('undefined'), context) === 'undefined')
})

test('read global vars', (t) => {
  const context = {
    'foo': 3
  }
  const snapshot = new Snapshot({ code: 'foo;' })
  init(snapshot, ['foo'])
  t.deepEqual<any>(unbox(snapshot.getVar('foo'), context), 3)
})

test('createEvaluator +', (t) => {
  const code = 'var x = 2;'
  const ast = parse(code) as ESTree.Program
  const snapshot = new Snapshot({ code, ast })
  const evaluator = createEvaluator(Observable.of(snapshot))
  return new Promise<void>((resolve, reject) => {
    evaluator.subscribe((result: Snapshot) => {
      t.true(isUndefined(result.value))
      resolve()
    })
  })
})

test('createEvaluator -', (t) => {
  const code = 'x;'
  const ast = parse(code) as ESTree.Program
  const snapshot = new Snapshot({ code, ast })
  const evaluator = createEvaluator(Observable.of(snapshot))
  t.plan(1)
  return new Promise<void>((resolve, reject) => {
    evaluator.subscribe((result: ISnapshotError) => {
      t.regex(result.message, /Undefined variable/)
      resolve()
    })
  })
})
