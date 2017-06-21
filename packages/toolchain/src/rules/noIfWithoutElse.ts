import * as es from 'estree'
import { generate } from 'escodegen'
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
    return `
      This "if" block requires corresponding "else" block which will be
      evaluated when ${generate(this.node.test)} expression evaluates to false.

      Later in the course we will lift this restriction and allow "if" without
      else.
    `
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
