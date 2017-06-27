import { createContext } from '../context'
import { parse } from '../parser'
import { generateCFG } from '../cfg'

describe('generateCFG', () => {
  it('throws when used on non successful parser state', () => {
    const state = createContext({ week: 3 })
    expect(() => generateCFG(state)).toThrow()
  })
  it(`creates empty graph on empty program`, () => {
    const state = createContext({ week: 3 })
    parse('', state)
    generateCFG(state)
    expect(state.cfg.scopes[0].node).toBeDefined()
    expect(state.cfg.scopes[0].entry).not.toBeDefined()
    expect(state.cfg.scopes[0].exits.length).toBe(0)
    expect(Object.keys(state.cfg.edges).length).toBe(1)
    expect(state.cfg.edges[Object.keys(state.cfg.edges)[0]].length).toBe(0)
  })
  it('correctly creates graph on sequence of statements', () => {
    const state = createContext({ week: 3 })
    parse(`var x = 2;\n1 + 5;\n1 + 4;\nvar z = 2;`, state)
    generateCFG(state)
    const g = state.cfg.scopes[0]
    expect(g.entry!.node.type).toBe('VariableDeclaration')
    expect(state.cfg.edges[g.entry!.id].length).toBe(1)
    expect(g.exits[0]!.node.type).toBe('VariableDeclaration')
    expect(g.exits.length).toBe(1)
  })
  it('correctly creates graph on if statements', () => {
    const state = createContext({ week: 3 })
    parse(`if (x == 3) {1 + 2;} else {var y = 2;}`, state)
    generateCFG(state)
    const g = state.cfg.scopes[0]
    expect(g.entry!.node.type).toBe('BinaryExpression')
    expect(state.cfg.edges[g.entry!.id].length).toBe(2)
    expect(state.cfg.edges[g.entry!.id][0].type).toBe('consequent')
    expect(state.cfg.edges[g.entry!.id][1].type).toBe('alternate')
    expect(g.exits.length).toBe(2)
    expect(g.exits[0]!.node.type).toBe('ExpressionStatement')
    expect(g.exits[1]!.node.type).toBe('VariableDeclaration')
  })
  it('correctly set CFG entry points', () => {
    const state = createContext({ week: 3 })
    parse(
      `
      function foo(x, y) {
        function zoo(x) {
          var m = 3;
        }
      }
      function bar(x) {
        var n = 2;
      }
      bar(2);
    `,
      state
    )
    generateCFG(state)
    expect(state.cfg.errors.length).toBe(0)
    state.cfg.scopes.forEach(s => {
      expect(s.entry).toBeDefined()
      expect(s.exits.length > 0).toBe(true)
    })
  })
  it('correctly collect CFG scopes', () => {
    const state = createContext({ week: 3 })
    parse(
      `
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
    `,
      state
    )
    generateCFG(state)
    expect(state.cfg.errors.length).toBe(0)
    expect(state.cfg.scopes.length).toBe(4)
    expect(state.cfg.scopes.map(n => n.name)).toEqual([
      '*global*',
      'foo',
      'bar',
      'zoo'
    ])
  })
})
