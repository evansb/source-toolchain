import { explainError } from '../src/errorUtils'
import { ErrorType } from '../src/errorTypes'
import { createParser, parse } from '../src/parser'
import { generateCFG } from '../src/cfg'

describe('generateCFG', () => {
  it('throws when used on non successful parser state', () => {
    const state = createParser({ week: 3 })
    expect(() => generateCFG(state)).toThrow()
  })
  it('detects undefined variable', () => {
    const state = createParser({ week: 3 })
    parse('var y = 1; x;', state)
    generateCFG(state)
    expect(state.errors.length).toBe(1)
    expect(state.errors[0].type).toBe(ErrorType.UndefinedVariable)
    expect(state.errors[0].type).toBe(ErrorType.UndefinedVariable)
    expect(explainError(state.errors[0])).toMatch(/Undefined/)
  })
  it('detects variable redeclaration', () => {
    const state = createParser({ week: 3 })
    parse(`
    var x = 2;
    1 + 2;
    var x = 2;
    `, state)
    generateCFG(state)
    expect(state.errors.length).toBe(1)
    expect(explainError(state.errors[0])).toMatch(/redeclaration/)
  })
  it('correctly set CFG roots', () => {
    const state = createParser({ week: 3 })
    parse(`
      function foo(x, y) {
        function zoo(x) {
          var m = 3;
        }
      }
      function bar(x) {
        var n = 2;
      }
      bar(2);
    `, state)
    generateCFG(state)
    expect(state.errors.length).toBe(0)
    state.cfg.scopes.forEach(s => {
      expect(s.root).toBeDefined()
    })
  })
  it('correctly creates scope', () => {
    const state = createParser({ week: 3 })
    parse(`
      function foo(x, y) {
        bar(4);
        function zoo(x) {
          bar(5);
        }
        zoo(3);
      }
      function bar(x) {
        foo(3);
        return 3;
      }
      var x = 2;
      var y = 4;
      foo(x, 3) + bar(y);
      bar(y);
      bar(x);
    `, state)
    generateCFG(state)
    expect(state.errors.length).toBe(0)
    expect(state.cfg.scopes.length).toBe(4)
    expect(state.cfg.scopes.map(n => n.name)).toEqual(['*global*', 'foo', 'bar', 'zoo'])
    expect(Object.keys(state.cfg.scopes[1].env)).toEqual(['x', 'y', 'zoo'])
    expect(state.cfg.scopeStack[0].name).toBe('*global*')
  })
})
