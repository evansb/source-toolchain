import { createContext } from '../../src/context'
import { CFG, StaticState } from '../../src/types/static'
import { isSameType, parseString } from '../../src/typechecker'

type Suite = {
  name: string
  source: string
  assertions: Array<{ name: string; type: CFG.Type }>
}

export const parseTypecheckerTest = (testFileContent: string): Suite[] => {
  const lines = testFileContent.split(/\n/)
  const suites: Suite[] = []

  let source = ''
  let testName = ''
  let assertions: Array<{ name: string; type: CFG.Type }> = []

  for (let line of lines) {
    line = line.trim()

    // Start of a new test
    // Collect previous suite
    if (line.match(/\/\/@/) && source.length > 0) {
      suites.push({
        name: testName,
        source,
        assertions
      })
      source = ''
      assertions = []
    }

    if (line.match(/\/\/!/)) {
      const assertion = line.split(/\/\/!/)[1]
      const [name, typeString] = assertion.trim().split(/:/)
      assertions.push({
        name: name.trim(),
        type: parseString(typeString.trim())
      })
    } else if (line.match(/\/\/@/)) {
      testName = line.split(/\/\/@/)[1].trim()
    }
    if (line) {
      source += line
      source += '\n'
    }
  }

  // Collect last suite
  if (source.length > 0) {
    suites.push({
      name: testName,
      source,
      assertions
    })
  }

  return suites
}

export const runTypecheckerTest = (
  suites: Suite[],
  parse: (source: string, state: StaticState) => void,
  generateCFG: (state: StaticState) => void,
  typecheck: (state: StaticState) => void
) => {
  suites.forEach(s => {
    const state = createContext({ week: 3 })
    parse(s.source, state)
    generateCFG(state)
    typecheck(state)
    s.assertions.forEach(a => {
      const { name, type: expectedType } = a
      expect(isSameType(state.cfg.scopes[0].env[name].type, expectedType)).toBe(
        true
      )
    })
  })
}
