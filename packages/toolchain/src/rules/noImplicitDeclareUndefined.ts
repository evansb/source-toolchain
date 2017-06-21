import * as es from 'estree'
import { IError } from '../types/error'
import { Rule } from '../types/static'

export class NoImplicitDeclareUndefinedError implements IError {
  constructor(public node: es.Identifier) {}

  get location() {
    return this.node.loc!
  }

  explain() {
    return 'Missing value in variable declaration'
  }

  elaborate() {
    return 'TODO'
  }
}

const noImplicitDeclareUndefined: Rule<es.VariableDeclaration> = {
  name: 'no-implicit-declare-undefined',

  checkNodes: {
    VariableDeclaration(node: es.VariableDeclaration) {
      const errors: IError[] = []
      for (const decl of node.declarations) {
        if (!decl.init) {
          errors.push(
            new NoImplicitDeclareUndefinedError(decl.id as es.Identifier)
          )
        }
      }
      return errors
    }
  }
}

export default noImplicitDeclareUndefined
