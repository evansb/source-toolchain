import * as invariant from 'invariant'
import * as es from 'estree'
import { ParserState, CFGVertex, CFGType } from './parser'
import { generate } from 'escodegen'
import { ErrorType } from './errorTypes'
import { stripIndent } from 'common-tags'

class TypeError {
  constructor(public node: es.Node, public explanation: string) {}
}

const checkBinaryOperator = (op: string, t1: CFGType, t2: CFGType): CFGType => {
}
/**
 * Run the type checker
 * @param state initial successful parser state
 */
export const typeCheck = (state: ParserState) => {
  invariant(state.node!, 'Must call parse -> generateCFG and successfully' +
    'generate CFG before calling typeCheck()')

  const checker: any = {
    BinaryExpression(node: es.BinaryExpression) {
      const left = checker[node.left.type](node.left)
      const right = checker[node.left.type](node.right)
      const op = node.operator
      let result
      if (op === '+' && (left.name === 'string' || right.name === 'string')) {
        result = {name: 'string'}
      } else if (op === '+' || op === '-' || op === '*' || op === '/' || op === '%') {
        if (left.name !== 'number' || right.name !== 'number') {
          throw new TypeError(node,
            stripIndent`Invalid arithmetic operation ${op}
             ${generate(node.left)} type is ${left.name}, and
             ${generate(node.right)} type is ${right.name}.
             This will result in NaN (Not A Number) value,
             which is probably what you don't want.`)
        }
      } else if (op === '<=' || op === '>=' || op === '<' || op === '>') {
        if (left.name !== 'boolean' || right.name !== 'boolean') {
          throw new TypeError(node,
            stripIndent`Invalid logical operation ${op}
             ${generate(node.left)} type is ${left.name}, and
             ${generate(node.right)} type is ${right.name}.
             We do not recommend using && or || for non boolean values for beginners
             Please use If Statement or Conditional Expression instead.`)
        }
      } else {
      }
    },
  }

  const check = ({node, edges}: CFGVertex) => {
    if (checker[node.type]) {
      checker[node.type](node)
    }
    edges.forEach((v) => check(v.node))
  }

  state.cfg.scopes.forEach(scope => {
    if (!scope.root) { return }
    check(scope.root)
  })

}
