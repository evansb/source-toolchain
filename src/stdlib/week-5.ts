import * as list from './list'

declare var draw: Function
declare var display: Function

export function createWeek5Libraries(): [any, string[]] { 
  const context: any = {}
  const globals: string[] = []
  const export_symbol = (s) => {
    window[s] = list[s]
    context[s] = list[s]
    globals.push(s)
  }
  export_symbol('pair')
  export_symbol('is_pair')
  export_symbol('head')
  export_symbol('tail')
  export_symbol('is_empty_list')
  export_symbol('is_list')
  export_symbol('list')
  export_symbol('length')
  export_symbol('map')
  export_symbol('build_list')
  export_symbol('for_each')
  export_symbol('list_to_string')
  export_symbol('reverse')
  export_symbol('append')
  export_symbol('member')
  export_symbol('remove')
  export_symbol('remove_all')
  export_symbol('equal')
  export_symbol('filter')
  export_symbol('enum_list')
  export_symbol('list_ref')
  export_symbol('accumulate')
  context.parseInt = parseInt
  context.prompt = prompt
  // List visualizer
  context.draw = function(xs) {
    if (typeof draw === 'function') {
      draw(xs)
    } else {
      display('Cannot find list visualizer, maybe it is not activated?')
    }
  }
  globals.push('parseInt', 'prompt', 'draw')
  return [context, globals]
}
