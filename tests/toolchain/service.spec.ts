/// <reference path='../../typings/index.d.ts' />
import { expect } from 'chai'
import { createContext } from '../../src/toolchain/service'

describe('Main API', () => {
  describe('createContext', () => {
    it('create isolated runtime contexts', () => {
      const ctx1 = createContext()
      const ctx2 = createContext()
      expect(ctx1).to.not.equal(ctx2)
    })
    it('throws when invalid week is specified', () => {
      expect(() => createContext(-2)).to.throw(/Invalid week/)
      expect(() => createContext(1)).to.throw(/Invalid week/)
      expect(() => createContext(14)).to.throw(/Invalid week/)
    })
    it('throws when context is not an object', () => {
      expect(() => createContext(3, [], 2 as any)).to.throw(/must be an object/)
    })
    it('throws when external property is missing in context', () => {
      expect(() => createContext(3, [{ name: 'Foobar' }], window)).to.throw()
    })
    it('throws when external property is invalid', () => {
      expect(() => createContext(3, [{} as any], window)).to.throw()
    })
  })
})
