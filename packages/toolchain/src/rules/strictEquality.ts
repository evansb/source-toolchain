import * as es from 'estree'
import { IError } from '../types/error'
import { Rule } from '../types/static'

export class StrictEqualityError implements IError {
  constructor(public node: es.BinaryExpression) {}

  get location() {
    return this.node.loc!
  }

  explain() {
    if (this.node.operator === '==') {
      return 'Use strict equality (===)'
    } else {
      return 'Use strict inequality (!==)'
    }
  }

  elaborate() {
    return 'TODO'
  }
}

const strictEquality: Rule<es.BinaryExpression> = {
  name: 'strict-equality',

  checkNodes: {
    BinaryExpression(node: es.BinaryExpression) {
      if (node.operator === '==' || node.operator === '!=') {
        return [new StrictEqualityError(node)]
      } else {
        return []
      }
    }
  }
}

export default strictEquality
