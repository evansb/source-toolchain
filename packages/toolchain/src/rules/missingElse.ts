import * as es from 'estree'
import { IError } from '../types/error'
import { Rule } from '../types/static'

export class MissingElseError implements IError {
  constructor(public node: es.IfStatement) {}

  get location() {
    return this.node.loc!
  }

  explain() {
    return 'Missing "else" in "if-else" statement'
  }

  elaborate() {
    return 'TODO'
  }
}

const missingElse: Rule<es.IfStatement> = {
  name: 'missing-else',

  checkNodes: {
    IfStatement(node: es.IfStatement) {
      if (!node.alternate) {
        return [new MissingElseError(node)]
      } else {
        return []
      }
    }
  }
}

export default missingElse
