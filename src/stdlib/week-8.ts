import { set_head, set_tail } from './list'

export function createWeek8Libraries(): [any, string[]] {
  const context: any = {}
  const globals: string[] = []
  const export_symbol = (s, f) => {
    window[s] = f
    context[s] = f
    globals.push(s)
  }
  export_symbol('set_head', set_head)
  export_symbol('set_tail', set_tail)
  return [context, globals]
}
