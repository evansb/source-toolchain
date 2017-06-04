import { generate } from 'escodegen'
import * as es from 'estree'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'acorn'
import { Map, Stack, List } from 'immutable'

import { evalStatement, State, Scope } from '../../src/evaluator'
import { blocking } from '../../src/scheduler'

const fixturesFolderPath = path.resolve(__dirname, '..', 'fixtures')

export type ConformationTest = {
  statement: es.Statement,
  expectedValue: any,
}

/**
 * Parse and extract a list of conformation tests from a file.
 * @param fixtureFilePath The fixture files
 */
export const loadAndParseConformation = (fixtureFilePath: string): ConformationTest[] => {
  const pathname = path.join(fixturesFolderPath, fixtureFilePath)
  const content = fs.readFileSync(pathname, 'utf8')
  const comments: string[] = []
  const expectedValues: any[] = []
  const tests: ConformationTest[] = []

  const ast = parse(content, {
    ecmaVersion: 5,
    locations: true,
    onComment: (isBlock, text) => {
      if (!isBlock) {
        // tslint:disable-next-line
        expectedValues.push(eval(text.trim()))
      }
    },
  })

  for (const [idx, statement] of ast.body.entries()) {
    tests.push({
      statement: statement as es.Statement,
      expectedValue: expectedValues[idx],
    })
  }

  return tests
}

/**
 * Run a conformation test from a fixture file
 * @param fixtureFilePath the path to fixture file, relative to fixtures directory
 */
export const runConformationTests = (fixtureFilePath: string) => {
  const tests = loadAndParseConformation(fixtureFilePath)

  const globalScope: Scope = {
    environment: Map<string, any>(),
  }

  let state = new State({
    isRunning: false,
    frames: Stack.of(0),
    scopes: Map.of(0, globalScope),
    errors: List(),
    expressions: Stack(),
    value: undefined,
  })

  tests.forEach(t => {
    const generator = evalStatement(t.statement, state)
    let isDone = false

    while (!isDone) {
      const g = generator.next()
      isDone = g.done
      state = g.value
    }

    if (state.value !== t.expectedValue) {
      // tslint:disable-next-line
      console.log(`L${t.statement.loc!.start.line}: ${generate(t.statement)}`)
    }

    expect(state.value).toBe(t.expectedValue)
  })
}
