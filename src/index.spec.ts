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
