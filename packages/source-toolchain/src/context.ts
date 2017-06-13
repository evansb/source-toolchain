import { StaticState } from './types/static'

export type Options = {
  week: number,
}

export const createContext = ({ week }: Options): StaticState => {
  const globalScope = {
    name: '*global*',
    env: {},
  }
  return {
    week,
    parser: {
      errors: [],
      comments: [],
    },
    cfg: {
      nodes: {},
      scopes: [globalScope],
      scopeStack: [globalScope],
      errors: [],
    },
  }
}