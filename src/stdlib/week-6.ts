import { is_number, is_string } from './misc'
import { equal } from './list'

export function createWeek6Libraries(): [any, string[]] { 
  const context: any = {}
  const globals: string[] = []
  const export_symbol = (s, f) => {
    window[s] = f
    context[s] = f
    globals.push(s)
  }
  export_symbol('is_number', is_number)
  export_symbol('is_string', is_string)
  export_symbol('equal', equal)
  return [context, globals]
}
