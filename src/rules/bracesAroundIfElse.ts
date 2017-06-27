import * as es from 'estree'
import { generate } from 'astring'
import { stripIndent } from 'common-tags'
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
      return 'Missing curly braces around "if" block'
    } else {
      return 'Missing curly braces around "else" block'
    }
  }

  elaborate() {
    let ifOrElse
    let header
    let body
    if (this.type === 'consequent') {
      ifOrElse = 'if'
      header = `if (${generate(this.node.test)})`
      body = this.node.consequent
    } else {
      ifOrElse = header = 'else'
      body = this.node.alternate
    }

    return stripIndent`
      ${ifOrElse} block need to be enclosed with a pair of curly braces.

      ${header} {
        ${generate(body)}
      }

      An exception is when you have an "if" followed by "else if", in this case
      "else if" block does not need to be surrounded by curly braces.

      if (someCondition) {
        // ...
      } else /* notice missing { here */ if (someCondition) {
        // ...
      } else {
        // ...
      }

      Rationale: Readability in dense packed code.

      In the snippet below, for instance, with poor indentation it is easy to
      mistaken hello() and world() to belong to the same branch of logic.

      if (someCondition) {
        2;
      } else
        hello();
      world();

    `
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
      if (node.alternate) {
        const notBlock = node.alternate.type !== 'BlockStatement'
        const notIf = node.alternate.type !== 'IfStatement'
        if (notBlock && notIf) {
          errors.push(new BracesAroundIfElseError(node, 'alternate'))
        }
      }
      return errors
    }
  }
}

export default bracesAroundIfElse
