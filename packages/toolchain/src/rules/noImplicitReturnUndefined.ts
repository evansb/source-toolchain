import * as es from 'estree'
import { stripIndent } from 'common-tags'
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
    return stripIndent`
      This return statement is missing a value.
      For instance, to return the value 42, you can write

        return 42;
    `
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
