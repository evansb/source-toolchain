import { DebuggerContext } from './debugger'
import { SourceContext } from './source'

const MIN_WEEK = 3 
const MAX_WEEK = 12

export type GlobalContext = Window | NodeJS.Global | { [name: string]: any }
export type Externals = { name: string, type?: string }[]

export class Context {
  public source: SourceContext
  public debugger: DebuggerContext

  constructor(
    public week: number,
    private globalCtx: GlobalContext,
    private externals: Externals) {
    const imported: { [name: string]: any } = {}
    externals.forEach((e) => {
      imported[e.name] = {
        type: e.type,
        value: globalCtx[e.name]
      }
    })
    this.source = new SourceContext(week, imported)
  }
}

/**
 * Create a new isolated Source runtime context.
 */
export function createContext(
  week: number = 3,
  externals: Externals = [],
  globalContext: GlobalContext = getDefaultContext()): Context {

  checkWeekOrThrow(week)
  checkExternalsOrThrow(globalContext, externals)

  return new Context(week, globalContext, externals)
}

function checkWeekOrThrow(week: number): void {
  if (week < MIN_WEEK || week > MAX_WEEK) {
    throw new Error(
      `Invalid week given ${week}\n` +
      `Week must be in range of ${MIN_WEEK}-${MAX_WEEK}\n`
    )
  }
}

function getDefaultContext(): GlobalContext {
  if (typeof module !== 'undefined' && module.exports) {
    return global
  } else {
    return window
  }
}

// TODO
function checkExternalsOrThrow(
  context: GlobalContext,
  externals: Externals): void {
  if (typeof context !== 'object') {
    throw new Error('Context must be an object')
  }
  externals.forEach(({ name, type }) => {
    if (!name) {
      throw new Error('Context must be an array of { name, type? }')
    }
    if (!context.hasOwnProperty(name)) {
      throw new Error(`Property '${name}' does not exist in context`)
    }
  })
  return
}
