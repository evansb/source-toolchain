import * as es from 'estree'
import { Scope } from './evaluatorTypes'
import { Map } from 'immutable'

export default class Closure {
  constructor(public node: es.FunctionExpression,
              public enclosing: number,
              public id?: number) {
  }

  createScope(args: any[]): Scope {
    const environment = this.node.params.reduce((s, p, idx) =>
      s.set((p as es.Identifier).name, args[idx])
    , Map<string, any>())
    return {
      name: this.getScopeName(args),
      parent: this.enclosing,
      environment,
    }
  }

  get name() {
    return this.node.id ? this.node.id.name : `<lambda-${this.id!}>`
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
