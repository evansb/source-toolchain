/// <reference path='../../typings/index.d.ts' />
import { expect } from 'chai'
import { SourceContext, Snapshot } from '../../src/toolchain/source'

describe('Source context pub/sub', () => {
  let ctx: SourceContext

  beforeEach(() => {
    ctx = new SourceContext(3, {})
  })
 
  it('has 0 jobs initially', () => {
    expect(ctx.lastJobID).to.equal(0)
  })

  it('emits freezed snapshot once done', (done) => {
    const callback = sinon.spy((err: Error, snapshot: Snapshot) => {
      expect(snapshot.completed).to.be.true
      expect(() => snapshot.completed = false).to.throw()
    })
    ctx.subscribe(callback)
    ctx.recreateProgram('function foo() { return 2; }')
    setTimeout(() => {
      expect(callback.callCount).to.equal(1)
      done()
    }, 10)
  })
 
  describe('recreateProgram', () => {
    it('resets existing snapshots', (done) => {
      ctx.subscribe((err, snapshot) => {
        expect(err).to.be.null
        expect(snapshot.id).to.equal(0)
        done()
      }, /source:commit/)
      ctx.recreateProgram('function foo() { return 2; }')
      expect(ctx.lastJobID).to.equal(1)
    })

    it('add source:created and source:commit to snapshot history', (done) => {
      ctx.subscribe((err, snapshot) => {
        expect(snapshot.history).to.contain('source:created')
        expect(snapshot.history).to.contain('source:commit')
        done()
      }, /source:commit/)
      ctx.recreateProgram('function foo() { return 2; }')
    })
  })

  describe('appendProgram', () => {   
    it('emit N snapshots if called N times', (done) => {
      const callback = sinon.spy()
      ctx.subscribe(callback, /source:commit/)
      ctx.appendProgram('function foo() { return 2; }')
      ctx.appendProgram('function bar() { return 2; }')
      setTimeout(() => {
        expect(callback.callCount).to.equal(2)
        done()
      }, 10)
      expect(ctx.lastJobID).to.equal(2)
    })
  }) 
})
