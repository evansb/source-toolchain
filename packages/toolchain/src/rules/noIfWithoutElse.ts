import * as es from 'estree'
import { IError } from '../types/error'
import { Rule } from '../types/static'

export class NoIfWithoutElseError implements IError {
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

const noIfWithoutElse: Rule<es.IfStatement> = {
  name: 'no-if-without-else',

  checkNodes: {
    IfStatement(node: es.IfStatement) {
      if (!node.alternate) {
        return [new NoIfWithoutElseError(node)]
      } else {
        return []
      }
    }
  }
}

export default noIfWithoutElse
