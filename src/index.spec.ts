import test from 'ava'
import { Observable } from 'rxjs/Observable'
import { createContext } from './index'
import 'rxjs/add/observable/of'

test('Simple integration', (t) => {
  return new Promise<void>((resolve, reject) => {
    t.plan(2)
    const { error$, snapshot$ } = createContext(Observable.from([
      { code: '1 + 2;', week: 3 }, 
      { code: 'x;', week: 3 }
    ]))
    error$.subscribe((e) => {
      t.truthy(e)
      resolve()
    })
    snapshot$.subscribe((s) => {
      t.deepEqual(s.value.value, 3)
    })
  })
})

test('Infinite loop', (t) => {
  return new Promise<void>((resolve, reject) => {
    t.plan(1)
    try {
      const { error$, snapshot$ } = createContext(Observable.from([
        { code: 'function f() { return f(); } f();', week: 3,
          maxCallStack: 100, timeout: 1000 }, 
      ]))
      error$.subscribe((e) => {
        t.truthy(e)
        resolve()
      })
      snapshot$.subscribe((s) => {
        t.fail()
      })
    } catch (e) {
      console.log(e)
    }
  })
})
