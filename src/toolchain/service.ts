import { DebuggerContext } from './debugger'
import { CompilerContext } from './compiler'

const MIN_WEEK = 3 
const MAX_WEEK = 13

export type GlobalContext = Window | NodeJS.Global | { [name: string]: any }
export type Externals = { name: string, type?: string }[]

export class Context {
  public compiler: CompilerContext
  public debugger: DebuggerContext

  constructor(
    public week: number,
    private globalCtx: GlobalContext,
    private externals: Externals) {
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
  return
}
