import * as es from 'estree'
import { createNode } from '../astUtils'
import Closure from '../Closure'

it('createNode correctly creates Node from value', () => {
  const n1 = createNode(3) as es.Literal
  expect(n1.type).toBe('Literal')
  expect(n1.value).toBe(3)

  const n2 = createNode(true) as es.Literal
  expect(n2.type).toBe('Literal')
  expect(n2.value).toBe(true)

  const n3 = createNode('Hello') as es.Literal
  expect(n3.type).toBe('Literal')
  expect(n3.value).toBe('Hello')

  const node: any = {}
  const fn = new Closure(node, 0)
  const n4 = createNode(fn)
  expect(n4).toBe(node)
})
