import { parse } from 'acorn'
import Closure from '../src/Closure'

describe('Closure class', () => {
  it('creates correct scope', () => {
    const node: any = parse('function factorial(n) {}').body[0]
    const closure = new Closure(node, 0)
    const scope = closure.createScope([4])
    expect(scope.name).toBe('factorial(4)')
    expect(scope.environment.get('n')).toBe(4)
    expect(scope.parent).toBe(0)
  })
  it('creates correct scope from anonymous function', () => {
    const node: any = (parse('var x = function (n) {};').body[0] as any).declarations[0].init
    const closure = new Closure(node, 0, 0)
    const scope = closure.createScope([4])
    expect(scope.name).toBe('<lambda-0>(4)')
    expect(scope.environment.get('n')).toBe(4)
    expect(scope.parent).toBe(0)
  })
  it('returns correct scope name if closure is passed as arguments', () => {
    const node: any = (parse('var x = function (n) {};').body[0] as any).declarations[0].init
    const closure = new Closure(node, 0, 0)
    const scope = closure.createScope([new Closure(node, 0, 1)])
    expect(scope.name).toBe('<lambda-0>(<lambda-1>)')
  })
})
