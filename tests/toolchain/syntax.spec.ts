/// <reference path='../../typings/index.d.ts' />
import { expect } from 'chai'
import { canUseSyntax, whenCanUseSyntax } from '../../src/toolchain/syntax'

describe('Syntax Utilities', () => {
  describe('canUseSyntax', () => {
    it('returns "yes" when a syntax can be used', () => {
      expect(canUseSyntax('Literal', 3)).to.equal('yes')
      expect(canUseSyntax('Literal', 5)).to.equal('yes')
    })
    it('returns "no" when a syntax cannot be used', () => {
      expect(canUseSyntax('EmptyStatement', 3)).to.equal('no')
    })
    it('returns "banned" when a syntax cannot be used forever', () => {
      expect(canUseSyntax('SpreadElement', 3)).to.equal('banned')
    })
  })
  describe('whenCanUseSyntax', () => {
    it('returns minimum week that syntax can be used', () => {
      expect(whenCanUseSyntax('Literal')).to.equal(3)
    })
    it('returns Infinity if a syntax is banned', () => {
      expect(whenCanUseSyntax('SpreadElement')).to.equal(Infinity)
    })
  })
})
