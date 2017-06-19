import * as es from 'estree'
import { IError } from '../types/error'
import { Rule } from '../types/static'

export class BracesAroundIfElseError implements IError {
  constructor(
    public node: es.IfStatement,
    public type: 'consequent' | 'alternate'
  ) {}

  get location() {
    return this.node.loc!
  }

  explain() {
    if (this.type === 'consequent') {
      return 'Missing curly braces around "if"'
    } else {
      return 'Missing curly braces around "else"'
    }
  }

  elaborate() {
    return 'TODO'
  }
}

const bracesAroundIfElse: Rule<es.IfStatement> = {
  name: 'braces-around-if-else',

  checkNodes: {
    IfStatement(node: es.IfStatement) {
      const errors: IError[] = []
      if (node.consequent && node.consequent.type !== 'BlockStatement') {
        errors.push(new BracesAroundIfElseError(node, 'consequent'))
      }
      if (node.alternate && node.alternate.type !== 'BlockStatement') {
        errors.push(new BracesAroundIfElseError(node, 'alternate'))
      }
      return errors
    }
  }
}

export default bracesAroundIfElse
