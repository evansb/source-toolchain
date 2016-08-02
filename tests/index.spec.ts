import test from 'ava'
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { IRequest, createServer, createRequestStream } from '../src/index'
import { Snapshot } from '../src/toolchain/common'
import 'rxjs/add/observable/from'
import 'rxjs/add/operator/take'

test('createRequestStream', (t) => {
  const server = createRequestStream(observer => {
    setTimeout(() => observer.next({ code: '1 + 2;', week : 3}), 100)
  })
  return new Promise<void>((resolve, reject) => {
    server.subscribe(r => {
      t.pass()
      resolve()
    })
  })
})

test('Simple integration', (t) => {
  return new Promise<void>((resolve, reject) => {
    t.plan(6)
    const server = createServer(Observable.from([
      { code: '1 + 2;', week: 3 }, 
      { code: 'x;', week: 3 },
      { code: 'function() {', week: 3 },
    ]))
    server.take(6).subscribe((e) => {
      if (e instanceof Snapshot) {
        t.deepEqual((<Snapshot> e).value.value, 3)
      } else {
        t.truthy(e)
      }
    }, reject, resolve)
  })
})

test('Read parent environment', (t) => {
  return new Promise<void>((resolve, reject) => {
    t.plan(2)
    const subject = new Subject<IRequest>()
    const server = createServer(subject) 
    let count = 0
    server.take(2).subscribe((e) => {
      if (e instanceof Snapshot) {
        count++
        t.deepEqual((<Snapshot> e).value.value, 2)
        if (count < 2) {
          subject.next({ code: 'x;', week: 3, parent: e })
        }
      } else {
        t.fail()
      }
    }, reject, resolve)
    subject.next({ code: 'var x = 2; x;', week: 3 })
  })
})

test('Infinite loop', (t) => {
  return new Promise<void>((resolve, reject) => {
    t.plan(1)
    try {
      const server = createServer(Observable.from([
        { code: 'function f() { return f(); } f();', week: 3,
          maxCallStack: 100, timeout: 1000 }, 
      ]))
      server.subscribe((e) => {
        t.truthy(e)
        resolve()
      })
    } catch (e) {
      t.fail()
    }
  })
})
