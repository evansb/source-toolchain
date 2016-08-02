import test from 'ava'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/take'
import 'rxjs/add/observable/of'

import { Snapshot } from '../../src/toolchain/common'
import * as parser from '../../src/toolchain/parser'

test('createParser', (t) => {
  t.plan(4)
  const snapshot$ = Observable.of(
    new Snapshot({ code: '1 + 2;' }),
    new Snapshot({ code: '[1, [2, 3]]', week: 3 }),
    new Snapshot({ code: 'function()', week: 3 })
  )
  const parser$ = parser.createParser(snapshot$)
  return new Promise<void>((resolve, reject) => {
    let count = 0
    parser$.subscribe((s) => {
      count++
      if (s instanceof Snapshot) {
        t.deepEqual((<Snapshot> s).ast.type, 'Program')
      } else {
        t.truthy(s)
      } 
      if (count === 4) {
        resolve()
      }
    }) 
  })
})
