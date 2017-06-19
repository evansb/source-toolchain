import * as es from 'estree'
import { IError } from '../types/error'
import { Rule } from '../types/static'

export class MultipleDeclarationsError implements IError {
  constructor(public node: es.VariableDeclaration) {}

  get location() {
    return this.node.loc!
  }

  explain() {
    return 'Multiple declaration in a single statement'
  }

  elaborate() {
    return 'TODO'
  }
}

const singleVariableDeclaration: Rule<es.VariableDeclaration> = {
  name: 'single-variable-declaration',

  checkNodes: {
    VariableDeclaration(node: es.VariableDeclaration) {
      if (node.declarations.length > 1) {
        return [new MultipleDeclarationsError(node)]
      } else {
        return []
      }
    }
  }
}

export default singleVariableDeclaration
