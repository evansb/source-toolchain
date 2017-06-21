import * as es from 'estree'
import { IError } from '../types/error'
import { Rule } from '../types/static'

export class NoImplicitReturnUndefinedError implements IError {
  constructor(public node: es.ReturnStatement) {}

  get location() {
    return this.node.loc!
  }

  explain() {
    return 'Missing value in return statement'
  }

  elaborate() {
    return 'TODO'
  }
}

const noImplicitReturnUndefined: Rule<es.ReturnStatement> = {
  name: 'no-implicit-return-undefined',

  checkNodes: {
    ReturnStatement(node: es.ReturnStatement) {
      if (!node.argument) {
        return [new NoImplicitReturnUndefinedError(node)]
      } else {
        return []
      }
    }
  }
}

export default noImplicitReturnUndefined
