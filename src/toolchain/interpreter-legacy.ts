import 'rxjs/add/operator/map'
import 'rxjs/add/operator/filter'
import { Snapshot, ISink, createError, box } from './common'
import { Parser, Compiler, Runtime } from 'jedi-runtime'
import { createWeek5Libraries } from '../stdlib/week-5'
import { createWeek6Libraries } from '../stdlib/week-6'
import { createWeek8Libraries } from '../stdlib/week-8'

function mergeLibraries(ctx1: any, glob1: string[], ctx2: any, glob2: string[]) {
  Object.assign(ctx1, ctx2)
  glob2.forEach(g => glob1.push(g))
}

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
      let libCtx = {}
      let libGlobals: string[] = []

      if (!snapshot.parent) {
        snapshot.context.Math = Math
        snapshot.context.alert = alert

        if (snapshot.week >= 5) {
          [libCtx, libGlobals] = createWeek5Libraries()
          mergeLibraries(snapshot.context, snapshot.globals, libCtx, libGlobals)
        }

        if (snapshot.week >= 6) {
          [libCtx, libGlobals] = createWeek6Libraries()
          mergeLibraries(snapshot.context, snapshot.globals, libCtx, libGlobals)
        }

        if (snapshot.week >= 6) {
          [libCtx, libGlobals] = createWeek8Libraries()
          mergeLibraries(snapshot.context, snapshot.globals, libCtx, libGlobals)
        }

        snapshot.runtime = new Runtime(
          snapshot.globals.concat(['Math', 'alert']),
          snapshot.context
        )
        value = snapshot.runtime.execute_instruction(
          artifact.instructions,
          undefined, undefined, timeoutAt, snapshot.maxCallStack
        ).value
      } else {
        value = snapshot.runtime.execute_more_instruction(
          artifact.instructions, timeoutAt, snapshot.maxCallStack).value
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
