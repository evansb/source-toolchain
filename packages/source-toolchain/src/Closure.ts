import * as es from 'estree'
import { Scope } from './evaluatorTypes'
import { Map } from 'immutable'

/**
 * Models function value in the interpreter environment.
 */
class Closure {

  /** The Function Expression */
  public node: es.FunctionExpression

  /** The enclosingScope scope */
  public enclosingScope: number

  /** Unique ID defined for anonymous closure */
  public id?: number

  constructor(node: es.FunctionExpression, enclosingScope: number, id?: number) {
    this.node = node
    this.enclosingScope = enclosingScope
    this.id = id
  }

  /**
   * Open a new scope from this function value by suppling list of arguments.
   * @param args List of arguments to be defined in the scope environment
   *
   * @returns {Scope}
   */
  createScope(args: any[]): Scope {
    const environment = this.node.params.reduce((s, p, idx) =>
      s.set((p as es.Identifier).name, args[idx])
    , Map<string, any>())
    return {
      name: this.getScopeName(args),
      parent: this.enclosingScope,
      environment,
    }
  }

  /** Get name of the scope */
  get name() {
    return this.node.id ? this.node.id.name : `lambda-${this.id!}`
  }

  getScopeName(args: any[]) {
    let name = `${this.name}(`
    args.forEach((arg, idx) => {
      if (arg instanceof Closure) {
        name += arg.name
      } else {
        name += arg.toString()
      }
      if (idx < args.length - 1) {
        name += ', '
      }
    })
    name += ')'
    return name
  }
}

export default Closure
