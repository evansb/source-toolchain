import { StaticState, CFG } from './types/static'

export type Options = {
  week: number
}

export const createContext = ({ week }: Options): StaticState => {
  const globalScope = {
    name: '*global*',
    env: {},
    type: { name: 'undefined' } as CFG.Type,
    node: undefined,
    exits: []
  }
  return {
    week,
    parser: {
      errors: [],
      comments: []
    },
    cfg: {
      nodes: {},
      edges: {},
      scopes: [globalScope],
      errors: []
    }
  }
}
