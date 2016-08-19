import 'rxjs/add/operator/map'
import 'rxjs/add/operator/filter'
import { Snapshot, ISink, createError, box } from './common'
import { Parser, Compiler, Runtime } from 'jedi-runtime'

export function createEvaluator(snapshot$: ISink): ISink {
  return snapshot$.map((s) => {
    if (!(s instanceof Snapshot)) { return s }
    const snapshot = <Snapshot> s
    let value
    try {
      const parser = new Parser(snapshot.week)
      const ast = parser.parse(snapshot.code)
      const artifact = Compiler.compile(ast, snapshot.code)
      const timeoutAt = +(new Date) + snapshot.timeout

      if (!snapshot.parent) {
        snapshot.context.Math = Math
        snapshot.context.alert = alert
        snapshot.runtime = new Runtime(
          snapshot.globals.concat(['Math', 'alert']),
          snapshot.context
        )
        value = snapshot.runtime.execute_instruction(
          artifact.instructions,
          undefined, undefined, timeoutAt
        ).value
      } else {
        value = snapshot.runtime.execute_more_instruction(
          artifact.instructions, timeoutAt).value
      }
      snapshot.done = true
      snapshot.value = box(snapshot.runtime.vm_value_to_javascript(value))
      return snapshot
    } catch (e) {
      const node = e.node || snapshot.currentNode
      const err = createError('interpreter', node, e.message)
      err.snapshot = snapshot
      return err
    }
  })
}
