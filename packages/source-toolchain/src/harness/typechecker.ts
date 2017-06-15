import * as path from 'path'
import * as fs from 'fs'
import { createContext } from '../../src/context'
import { CFG, numberT } from '../../src/types/static'
import { parse } from '../../src/parser'
import { generateCFG } from '../../src/cfg'
import { typecheck, isSameType, parseString } from '../../src/typechecker'

type Suite = {
  name: string
  source: string
  assertions: Array<{ name: string; type: CFG.Type }>
}

export const runTypecheckerTest = (filename: string) => {
  filename = path.join(
    path.resolve(__dirname, '../../'),
    'test',
    'fixtures',
    'typechecker',
    filename
  )
  const suites: Suite[] = []

  let current = ''
  let testName = ''
  let currentAssertions: Array<{ name: string; type: CFG.Type }> = []

  for (let line of fs.readFileSync(filename, 'utf8').split(/\n/)) {
    line = line.trim()
    // First test
    if (line.match(/\/\/@/) && current.length > 0) {
      // Start of a new test
      const source = current
      const state = createContext({ week: 3 })
      suites.push({
        name: testName,
        source,
        assertions: currentAssertions
      })
      current = ''
      currentAssertions = []
      testName = line.split(/\/\/@/)[1].trim()
    } else if (line.match(/\/\/!/)) {
      const assertion = line.split(/\/\/!/)[1]
      const [name, typeString] = assertion.trim().split(/:/)
      currentAssertions.push({
        name: name.trim(),
        type: parseString(typeString.trim())
      })
    } else if (line.match(/\/\/@/)) {
      testName = line.split(/\/\/@/)[1].trim()
    } else {
      current += line
      current += '\n'
    }
  }

  suites.push({
    name: testName,
    source: current,
    assertions: currentAssertions
  })

  suites.forEach(s => {
    const state = createContext({ week: 3 })
    it(`typechecks ${s.name}`, () => {
      parse(s.source, state)
      generateCFG(state)
      typecheck(state)
      s.assertions.forEach(a => {
        const { name, type: expectedType } = a
        expect(
          isSameType(state.cfg.scopes[0].env[a.name].type, expectedType)
        ).toBe(true)
      })
    })
  })
}
